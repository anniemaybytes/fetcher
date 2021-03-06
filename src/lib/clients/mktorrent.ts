import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import { Config } from './config';
import type { Episode } from '../models/episode';
import { getLogger } from '../logger';
const execAsync = promisify(execFile);
const logger = getLogger('mktorrent');

export async function makeTorrentFile(episode: Episode, retry = true): Promise<void> {
  const storagePath = episode.getStoragePath();
  const torrentPath = episode.getTorrentPath();
  const { tracker_url, tracker_source } = Config.getConfig();
  const cmd = ['mktorrent', '-l', '19', '-p', '-a', tracker_url || '', storagePath, '-o', torrentPath, '-s', tracker_source || ''];
  try {
    await execAsync('/usr/bin/env', cmd);
  } catch (e) {
    if (retry && e?.message?.match(/file exists/i)) {
      logger.warn(`Torrent ${torrentPath} already exists; deleting and re-creating`);
      await fs.unlink(torrentPath);
      return makeTorrentFile(episode, false);
    }
    throw e;
  }
}
