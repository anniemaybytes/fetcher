import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';

import { Config } from './config.js';
import type { Episode } from '../models/episode.js';

import { Logger } from '../logger.js';
const logger = Logger.get('MkTorrent');

export class MkTorrent {
  // for testing purposes
  public static exec = promisify(execFile);
  public static fs = fs;

  public static async make(episode: Episode): Promise<void> {
    const storagePath = episode.getStoragePath();
    const torrentPath = episode.getTorrentPath();
    const { tracker_url, tracker_source } = Config.getConfig();

    return MkTorrent.execute(['mktorrent', '-l', '19', '-p', '-s', tracker_source || '', '-a', tracker_url || '', '-o', torrentPath, storagePath]);
  }

  private static async execute(cmd: Array<string>, retry = true): Promise<void> {
    try {
      await MkTorrent.exec('/usr/bin/env', cmd);
    } catch (e) {
      if (retry && e?.message?.match(/file exists/i)) {
        const torrentPath = cmd[cmd.indexOf('-o') + 1];

        logger.warn(`Torrent ${torrentPath} already exists; deleting and re-creating`);
        await MkTorrent.fs.unlink(torrentPath);
        return MkTorrent.execute(cmd, false);
      }
      throw e;
    }
  }
}
