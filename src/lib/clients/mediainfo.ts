import { execFile } from 'child_process';
import { promisify } from 'util';
import { MediaInfo } from '../../types';
import { getLogger } from '../logger';
const execAsync = promisify(execFile);
const logger = getLogger('mediainfo');

const divXCodecs = ['div3', 'divx', 'dx50'];
const audioChannelsMap = {
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

// Exported for testing purposes only
export function parseMediaInfoJSON(mediaInfoJSON: any) {
  if (Array.isArray(mediaInfoJSON)) throw new Error('non-singular number of files ' + mediaInfoJSON.length);
  let audio = '';
  let audiochannels = '';
  let codec = '';
  mediaInfoJSON.media.track.forEach((track: any) => {
    if (track['@type'] === 'Video') {
      codec = track.Format;
      const codecLower = codec.toLowerCase();

      if (codecLower === 'mpeg video') codec = 'MPEG-2';
      else if (codecLower === 'xvid') codec = 'XviD';
      else if (codecLower === 'x264') codec = 'h264';
      else if (divXCodecs.includes(codecLower)) codec = 'DivX';
      else if (codecLower.includes('avc')) codec = 'h264';
      else if (codecLower.includes('hevc')) codec = 'h265';

      if (track.BitDepth === '10' && (codec === 'h264' || codec === 'h265')) codec += ' 10-bit';
    } else if (track['@type'] === 'Audio') {
      audio = track.Format;
      const audioLower = audio.toLowerCase();

      if (audioLower === 'mpeg audio') audio = 'MP3';
      else if (audioLower.includes('ac-3')) audio = 'AC3';

      audiochannels = audioChannelsMap[track.Channels] || '';
    }
  });
  if (!audio || !audiochannels) logger.warn(`MediaInfo couldn't parse audio information for ${mediaInfoJSON.media['@ref']}`);
  if (!codec) logger.warn(`MediaInfo couldn't parse codec information for ${mediaInfoJSON.media['@ref']}`);
  return { audio, audiochannels, codec };
}

export async function getMediaInfo(file: string, replacementPath: string): Promise<MediaInfo> {
  const text = (await execAsync('/usr/bin/env', ['mediainfo', file])).stdout.replace(file, replacementPath);
  const json = JSON.parse((await execAsync('/usr/bin/env', ['mediainfo', '--output=JSON', file])).stdout);
  const mediaInfo = parseMediaInfoJSON(json);
  return { ...mediaInfo, text };
}
