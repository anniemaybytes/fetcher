import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(execFile);

import { MediaInfoInfo } from '../../types.js';

import { Logger } from '../logger.js';
const logger = Logger.get('MediaInfo');

export class MediaInfo {
  private static divXCodecs = ['div3', 'divx', 'dx50'];
  private static audioChannelsMap = {
    '8': '7.1',
    '7.1': '7.1',
    '7': '6.1',
    '6.1': '6.1',
    '6': '5.1',
    '5.1': '5.1',
    '5.0': '5.0',
    '5': '5.0',
    '3': '2.1',
    '2.1': '2.1',
    '2.0': '2.0',
    '2': '2.0',
    '1.0': '1.0',
    '1': '1.0',
  } as any;

  // Public for testing purposes
  public static parse(mediaInfoJSON: any) {
    if (Array.isArray(mediaInfoJSON)) throw new Error('Non-singular number of files ' + mediaInfoJSON.length);
    let audio = '';
    let audiochannels = '';
    let dualaudio = false;
    let codec = '';
    let extension = '';

    mediaInfoJSON.media.track.forEach((track: any) => {
      if (track['@type'] === 'General') {
        extension = track.FileExtension;
      } else if (track['@type'] === 'Video') {
        if (codec) return; // handle first video stream only

        codec = track.Format;

        const codecLower = codec.toLowerCase();
        if (codecLower === 'mpeg video') codec = 'MPEG-2';
        else if (codecLower === 'xvid') codec = 'XviD';
        else if (codecLower === 'x264') codec = 'h264';
        else if (MediaInfo.divXCodecs.includes(codecLower)) codec = 'DivX';
        else if (codecLower.includes('avc')) codec = 'h264';
        else if (codecLower.includes('hevc')) codec = 'h265';

        if (track.BitDepth === '10' && (codec === 'h264' || codec === 'h265')) codec += ' 10-bit';
      } else if (track['@type'] === 'Audio') {
        if (audio && audiochannels) {
          dualaudio = true; // assume dual-audio if more than one track present
          return; // assume format/channels of first track
        }

        audio = track.Format;
        audiochannels = MediaInfo.audioChannelsMap[track.Channels] || '';

        const audioLower = audio.toLowerCase();
        if (audioLower === 'mpeg audio') audio = 'MP3';
        else if (audioLower.includes('ac-3')) audio = 'AC3';
      }
    });
    if (!audio || !audiochannels) logger.warn(`MediaInfo couldn't parse audio information for ${mediaInfoJSON.media['@ref']}`);
    if (!codec) logger.warn(`MediaInfo couldn't parse codec information for ${mediaInfoJSON.media['@ref']}`);
    return { audio, audiochannels, dualaudio, codec, extension };
  }

  public static async get(storagePath: string): Promise<MediaInfoInfo> {
    const text = (await execAsync('/usr/bin/env', ['mediainfo', storagePath])).stdout.replace(storagePath, path.basename(storagePath));
    const json = JSON.parse((await execAsync('/usr/bin/env', ['mediainfo', '--output=JSON', storagePath])).stdout);
    const mediaInfo = MediaInfo.parse(json);
    return { ...mediaInfo, text };
  }
}
