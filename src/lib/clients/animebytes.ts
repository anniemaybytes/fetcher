import { createReadStream } from 'fs';
import { createHmac } from 'crypto';
import got from 'got';
import { CookieJar } from 'tough-cookie';
import FormData from 'form-data';

import { Config } from './config.js';
import { Episode } from '../models/episode.js';
import { MediaInfoInfo } from '../../types.js';

import { Logger } from '../logger.js';
const logger = Logger.get('ABClient');

const abLoginURL = '/user/login';
const abUploadURL = '/upload.php';
const abShowsURL = '/tools.php?action=airing_shows_json';

const REQUEST_TIMEOUT_MS = 1000 * 30; // 30 seconds

export class ABClient {
  public static username: string;
  public static password: string;
  public static m2m_secret: {
    captcha: Buffer;
    altcha: Buffer;
  };
  public static base_uri: string;

  // Only public for testing purposes
  public static cookieJar = new CookieJar();
  public static got = got.extend({
    headers: { 'User-Agent': 'fetcher/2.0 (got [AnimeBytes])' },
    cookieJar: ABClient.cookieJar,
    followRedirect: false,
    throwHttpErrors: false,
    timeout: { request: REQUEST_TIMEOUT_MS },
    retry: { limit: 0 },
  });

  public static async initialize() {
    ABClient.username = Config.getConfig().animebytes?.username;
    ABClient.password = Config.getConfig().animebytes?.password;
    ABClient.m2m_secret = {
      captcha: Buffer.from(Config.getConfig()?.animebytes?.m2m?.captcha ?? '', 'base64'),
      altcha: Buffer.from(Config.getConfig()?.animebytes?.m2m?.altcha ?? '', 'base64'),
    };
    ABClient.base_uri = Config.getConfig().animebytes?.base_uri;
  }

  public static async ensureLoggedIn() {
    const response = await ABClient.got(`${ABClient.base_uri}${abLoginURL}`, { responseType: 'text' });
    // Already authenticated if we receieve a 303 from the login page
    if (response.statusCode !== 303) {
      if (response.statusCode !== 200) throw new Error(`HTTP status ${response.statusCode} when checking login page`);
      logger.info(`Logging into AnimeBytes with user ${ABClient.username}`);
      const csrfData = {
        _CSRF_INDEX: response.body.match(/_CSRF_INDEX"\s+value="(.*)"(?:\s\/)?>/)?.[1],
        _CSRF_TOKEN: response.body.match(/_CSRF_TOKEN"\s+value="(.*)"(?:\s\/)?>/)?.[1],
      };
      const captchaProof = {
        _VICAPTCHA_INDEX: response.body.match(/_VICAPTCHA_INDEX"\s+value="(.*)"(?:\s\/)?>/)?.[1],
        _VICAPTCHA_M2M_PROOF: createHmac('sha256', ABClient.m2m_secret.captcha)
          .update(response.body.match(/_VICAPTCHA_INDEX"\s+value="(.*)"(?:\s\/)?>/)?.[1] ?? '', 'utf8')
          .digest('hex'),
        _ALTCHA_INDEX: response.body.match(/_ALTCHA_INDEX"\s+value="(.*)"(?:\s\/)?>/)?.[1],
        _ALTCHA_M2M_PROOF: createHmac('sha256', ABClient.m2m_secret.altcha)
          .update(response.body.match(/_ALTCHA_INDEX"\s+value="(.*)"(?:\s\/)?>/)?.[1] ?? '', 'utf8')
          .digest('hex'),
      };
      // Perform actual login request
      const loginResponse = await ABClient.got(`${ABClient.base_uri}${abLoginURL}`, {
        method: 'POST',
        form: {
          username: ABClient.username,
          password: ABClient.password,
          ...csrfData,
          ...captchaProof,
        },
      });
      if (loginResponse.statusCode !== 303) throw new Error(`HTTP status ${loginResponse.statusCode} when logging in`);
    }
    // Check that we can access upload page properly
    const uploadPageResponse = await ABClient.got(`${ABClient.base_uri}${abUploadURL}`);
    if (uploadPageResponse.statusCode !== 200) throw new Error(`HTTP status ${uploadPageResponse.statusCode} when checking for upload ability`);
  }

  public static async upload(episode: Episode, mediaInfo: MediaInfoInfo, torrentPath: string) {
    if (!episode.groupID) throw new Error('Cannot upload without groupID');
    const formData = {
      groupid: episode.groupID,
      submit: 'true',
      form: 'anime',
      section: 'anime',
      add_format: '1',
      CatID: '1',
      file_input: createReadStream(torrentPath),
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
    await ABClient.ensureLoggedIn();
    const requestBody = new FormData();
    Object.entries(formData).forEach(([key, value]) => requestBody.append(key, value));
    const response = await ABClient.got(`${ABClient.base_uri}${abUploadURL}?type=anime&groupid=${episode.groupID}`, {
      method: 'POST',
      body: requestBody,
      retry: { limit: 0 },
      responseType: 'text',
    });
    // Check result
    if (response.statusCode === 409) {
      logger.warn(`Upload Conflict: ${episode.formattedName()}`);
      return;
    } else if (response.body.match(/torrent file already exists/i)) {
      logger.warn(`Upload Exists: ${episode.formattedName()}`);
      return;
    } else if (response.body.match(/the following error/i)) {
      const errMatch = response.body.match(/the following error.*\n.*<p .*?>(.*)<\/p>/im);
      const err = errMatch ? errMatch[1].replace(/<br.*?>/g, ' ') : 'unknown reason';
      throw new Error(`Upload failed: ${err}`);
    } else if (response.statusCode !== 302) {
      throw new Error(`Upload failed with HTTP status ${response.statusCode}`);
    }
    logger.info(`Uploaded ${episode.formattedName()} torrent to AnimeBytes`);
  }

  // Returns raw buffer of the return body so it can be properly hashed and written to disk without modification
  public static async getShows() {
    await ABClient.ensureLoggedIn();
    const response = await ABClient.got(`${ABClient.base_uri}${abShowsURL}`, { responseType: 'buffer' });
    if (response.statusCode !== 200) throw new Error(`Show fetch failed HTTP status ${response.statusCode}`);
    return response.body;
  }
}
