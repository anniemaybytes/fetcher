import { createReadStream } from 'fs';
import { URLSearchParams } from 'url';
import nodeFetch from 'node-fetch';
import cookieFetch from 'fetch-cookie/node-fetch';
import FormData from 'form-data';
import { Config } from './config';
import { Episode } from '../models/episode';
import { MediaInfo } from '../../types';
import { getLogger } from '../logger';
const logger = getLogger('AnimeBytesClient');

const abLoginURL = 'https://animebytes.tv/user/login';
const abUploadURL = 'https://animebytes.tv/upload.php';

export class AnimeBytes {
  public static username: string;
  public static password: string;
  public static shows_uri: string;
  // Only public for testing purposes
  public static fetch = cookieFetch(nodeFetch);

  public static async initialize() {
    const { tracker_user, tracker_pass, shows_uri } = Config.getConfig();
    AnimeBytes.username = tracker_user;
    AnimeBytes.password = tracker_pass;
    AnimeBytes.shows_uri = shows_uri;
  }

  public static async ensureLoggedIn() {
    const response = await AnimeBytes.fetch(abLoginURL, { redirect: 'manual' });
    // Already authenticated if we receieve a 303 from the login page
    if (response.status !== 303) {
      if (response.status !== 200) throw new Error(`HTTP status ${response.status} when checking login page`);
      const textBody = await response.text();
      logger.info(`Logging into AnimeBytes with user ${AnimeBytes.username}`);
      // Perform actual login request
      const loginResponse = await AnimeBytes.fetch(abLoginURL, {
        method: 'POST',
        redirect: 'manual',
        body: new URLSearchParams({
          username: AnimeBytes.username,
          password: AnimeBytes.password,
          keeplogged: 'on',
          _CSRF_INDEX: textBody.match(/_CSRF_INDEX"\s+value="(.*)"\s\/></)?.[1],
          _CSRF_TOKEN: textBody.match(/_CSRF_TOKEN"\s+value="(.*)"\s\/>/)?.[1],
        }),
      });
      if (loginResponse.status !== 303) throw new Error(`HTTP status ${loginResponse.status} when logging in`);
    }
    // Check that we can access upload page properly
    const uploadPageResponse = await AnimeBytes.fetch(abUploadURL, { redirect: 'manual' });
    if (uploadPageResponse.status !== 200) throw new Error(`HTTP status ${uploadPageResponse.status} when checking for upload ability`);
  }

  public static async upload(episode: Episode, mediaInfo: MediaInfo) {
    if (!episode.groupID) throw new Error('Cannot upload without groupID');
    const formData = {
      groupid: episode.groupID,
      submit: 'true',
      form: 'anime',
      section: 'anime',
      add_format: '1',
      CatID: '1',
      file_input: createReadStream(episode.getTorrentPath()),
      downmultiplier: '0', // Airing episodes are freeleech
      upmultiplier: '1',
      media: episode.media,
      containers: episode.container.toUpperCase(),
      codecs: mediaInfo.codec,
      resolution: episode.resolution,
      audio: mediaInfo.audio,
      audiochannels: mediaInfo.audiochannels,
      sequence: episode.episode,
      release_group_name: episode.groupName,
      subbing: episode.subbing,
      remaster: 'on',
      mediainfo_desc: mediaInfo.text,
    };
    logger.info(`Uploading: ${episode.formattedName()} torrent to AnimeBytes`);
    await AnimeBytes.ensureLoggedIn();
    const requestBody = new FormData();
    Object.entries(formData).forEach(([key, value]) => requestBody.append(key, value));
    const response = await AnimeBytes.fetch(`${abUploadURL}?type=anime&groupid=${episode.groupID}`, { method: 'POST', body: requestBody });
    const body = await response.text();
    // Check result
    if (response.status === 409) {
      logger.warn(`Upload Conflict: ${episode.formattedName()}`);
      return;
    } else if (body.match(/torrent file already exists/i)) {
      logger.warn(`Upload Exists: ${episode.formattedName()}`);
      return;
    } else if (response.status !== 200) {
      throw new Error(`Upload failed with HTTP status ${response.status}`);
    } else if (body.match(/the following error/i)) {
      const errMatch = body.match(/the following error.*\n.*<p .*?>(.*)<\/p>/im);
      const err = errMatch ? errMatch[1].replace(/<br.*?>/g, ' ') : 'unknown reason';
      throw new Error(`Upload failed: ${err}`);
    }
    logger.info(`Uploaded ${episode.formattedName()} torrent to AnimeBytes`);
  }

  // Returns raw buffer of the return body so it can be properly hashed and written to disk without modification
  public static async getShows() {
    await AnimeBytes.ensureLoggedIn();
    const response = await AnimeBytes.fetch(AnimeBytes.shows_uri, { redirect: 'manual' });
    if (response.status !== 200) throw new Error(`Show fetch failed HTTP status ${response.status}`);
    const body = await response.buffer();
    return body as Buffer;
  }
}
