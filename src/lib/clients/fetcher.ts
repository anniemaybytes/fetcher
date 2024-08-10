import { promises as fs } from 'fs';
import { createHash } from 'crypto';

import { Config } from './config.js';
import { ABClient } from './animebytes.js';
import { Shows, Releasers } from '../../types.js';

import { Logger } from '../logger.js';
const logger = Logger.get('ShowReleasersFetcher');

export class ShowsReleasersFetcher {
  public static showsJSON: Shows;
  public static releasersJSON: Releasers;
  public static lastHash = '';

  // Returns true if shows have changed, or false if they have not
  public static async reload() {
    const showsFile = Config.getConfig().storage?.shows_file || 'shows.json';
    let showsBuf: Buffer;
    try {
      showsBuf = await ABClient.getShows();
    } catch (e) {
      logger.warn('Error fetching shows remotely; continuing from cache', e);
      showsBuf = await fs.readFile(showsFile);
    }
    const sha256Hash = createHash('sha256').update(showsBuf).digest().toString('base64');
    if (sha256Hash === ShowsReleasersFetcher.lastHash) return false; // Nothing has changed
    const response = JSON.parse(showsBuf.toString()); // ensure it parses as JSON before writing to disk
    await fs.writeFile(showsFile, showsBuf);
    ShowsReleasersFetcher.lastHash = sha256Hash;
    ShowsReleasersFetcher.showsJSON = response.shows;
    ShowsReleasersFetcher.releasersJSON = response.releasers;
    return true;
  }
}
