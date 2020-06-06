import { createReadStream } from 'fs';
import got from 'got';
import { CookieJar } from 'tough-cookie';
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
  public static cookieJar = new CookieJar();
  public static got = got.extend({ cookieJar: AnimeBytes.cookieJar, timeout: 30000 });

  public static async initialize() {
    const { tracker_user, tracker_pass, shows_uri } = Config.getConfig();
    AnimeBytes.username = tracker_user;
    AnimeBytes.password = tracker_pass;
    AnimeBytes.shows_uri = shows_uri;
  }

  public static async ensureLoggedIn() {
    const response = await AnimeBytes.got(abLoginURL, { followRedirect: false, responseType: 'text' });
    // Already authenticated if we receieve a 303 from the login page
    if (response.statusCode !== 303) {
      if (response.statusCode !== 200) throw new Error(`HTTP status ${response.statusCode} when checking login page`);
      logger.info(`Logging into AnimeBytes with user ${AnimeBytes.username}`);
      // Perform actual login request
      const loginResponse = await AnimeBytes.got(abLoginURL, {
        method: 'POST',
        followRedirect: false,
        form: {
          username: AnimeBytes.username,
          password: AnimeBytes.password,
          keeplogged: 'on',
          _CSRF_INDEX: response.body.match(/_CSRF_INDEX"\s+value="(.*)"\s\/></)?.[1],
          _CSRF_TOKEN: response.body.match(/_CSRF_TOKEN"\s+value="(.*)"\s\/>/)?.[1],
        },
      });
      if (loginResponse.statusCode !== 303) throw new Error(`HTTP status ${loginResponse.statusCode} when logging in`);
    }
    // Check that we can access upload page properly
    const uploadPageResponse = await AnimeBytes.got(abUploadURL, { followRedirect: false });
    if (uploadPageResponse.statusCode !== 200) throw new Error(`HTTP status ${uploadPageResponse.statusCode} when checking for upload ability`);
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
    const response = await AnimeBytes.got(`${abUploadURL}?type=anime&groupid=${episode.groupID}`, {
      method: 'POST',
      body: requestBody,
      responseType: 'text',
    });
    // Check result
    if (response.statusCode === 409) {
      logger.warn(`Upload Conflict: ${episode.formattedName()}`);
      return;
    } else if (response.body.match(/torrent file already exists/i)) {
      logger.warn(`Upload Exists: ${episode.formattedName()}`);
      return;
    } else if (response.statusCode !== 200) {
      throw new Error(`Upload failed with HTTP status ${response.statusCode}`);
    } else if (response.body.match(/the following error/i)) {
      const errMatch = response.body.match(/the following error.*\n.*<p .*?>(.*)<\/p>/im);
      const err = errMatch ? errMatch[1].replace(/<br.*?>/g, ' ') : 'unknown reason';
      throw new Error(`Upload failed: ${err}`);
    }
    logger.info(`Uploaded ${episode.formattedName()} torrent to AnimeBytes`);
  }

  // Returns raw buffer of the return body so it can be properly hashed and written to disk without modification
  public static async getShows() {
    await AnimeBytes.ensureLoggedIn();
    const response = await AnimeBytes.got(AnimeBytes.shows_uri, { followRedirect: false, responseType: 'buffer' });
    if (response.statusCode !== 200) throw new Error(`Show fetch failed HTTP status ${response.statusCode}`);
    return response.body;
  }
}
