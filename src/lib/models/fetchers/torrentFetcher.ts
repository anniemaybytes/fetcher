import path from 'path';
import WebTorrent from 'webtorrent';
import { Fetcher } from './fetcher';
import { TorrentFetchOptions } from '../../../types';
import { Config } from '../../clients/config';
import { sleep } from '../../utils';
import { rename } from 'fs';
import { promisify } from 'util';
const renameAsync = promisify(rename);

export class TorrentFetcher extends Fetcher {
  // TODO: Threading solution for torrent, so it doesn't eat the CPU
  public static client = new WebTorrent({
    maxConns: 50,
    dht: true,
    webSeeds: false,
    tracker: {
      wrtc: false,
    },
  });
  public static noPeerTimeout = 1000 * 60 * 5; // 5 minutes
  public static maxActiveDownloads = 5;

  uri: string;

  constructor(path: string, options: TorrentFetchOptions) {
    super('torrent', path);
    this.uri = options.uri;
  }

  // For globally shutting down
  public static async shutdown() {
    return new Promise<any>((resolve) => {
      TorrentFetcher.client.destroy(resolve);
    });
  }

  public async fetch() {
    const tempDir = Config.getConfig().temporary_dir || '/tmp/fetcher';
    while (TorrentFetcher.client.torrents.length >= TorrentFetcher.maxActiveDownloads) {
      // Throttle if too many torrents are in progress
      await sleep(10000);
    }
    return new Promise<void>((resolve, reject) => {
      const torrent = TorrentFetcher.client.add(this.uri, { path: tempDir });
      /*
      Due to a design flaw in webtorrent, it can attach many listeners to a single emitter, which is discouraged by nodejs,
      causing it to output a warning mentioning a 'possible memory leak' because too many listeners are attached.
      In this case, it is not a memory leak (and is expected behavior), so we disable the max listener warning limit here to silence this message.
      See this for more info: https://github.com/webtorrent/webtorrent/issues/889
      */
      torrent.setMaxListeners(0);
      const metadataError = () => {
        torrent.destroy();
        return reject(new Error(`Took too long or failed to fetch metadata`));
      };
      const timeout = setTimeout(metadataError, 90 * 1000); // If torrent metadata isn't fetched/resolved in 90 seconds, consider it a failure
      torrent.on('error', metadataError); // Interim error handler required until metadata is ready
      torrent.on('ready', () => {
        torrent.removeListener('error', metadataError);
        clearTimeout(timeout);
        if (torrent.files.length !== 1) {
          torrent.destroy();
          return reject(new Error(`torrent has ${torrent.files.length} files, must have 1`));
        }
        const startDate = Date.now();
        this.length = torrent.length;
        torrent.on('noPeers', () => {
          if (Date.now() - startDate >= TorrentFetcher.noPeerTimeout && torrent.numPeers === 0 && torrent.progress < 1) {
            torrent.destroy();
            return reject(new Error('torrent has no peers'));
          }
        });
        torrent.on('error', (err) => {
          // Torrent is already destroyed by this point
          return reject(err);
        });
        torrent.on('download', () => {
          this.fetched = torrent.downloaded;
        });
        torrent.on('done', async () => {
          torrent.pause();
          await renameAsync(path.resolve(tempDir, torrent.files[0].path), this.path);
          torrent.destroy();
          resolve();
        });
      });
    });
  }
}

Fetcher.registerFetcherType('torrent', TorrentFetcher);
