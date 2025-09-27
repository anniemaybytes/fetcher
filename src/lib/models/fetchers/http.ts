import path from 'path';
import { createWriteStream } from 'fs';
import { URL } from 'url';
import { pipeline } from 'stream';
import got, { Response } from 'got';

import { Fetcher } from './fetcher.js';
import { Config } from '../../clients/config.js';
import { Utils } from '../../utils.js';
import { HTTPFetchOptions } from '../../../types.js';

export class HTTPFetcher extends Fetcher {
  // Public for testing purposes
  public static got = got.extend({
    headers: { 'User-Agent': 'fetcher/2.0 (got [HTTPFetcher])' },
    retry: { limit: 0 },
  });

  public url: string;
  public filename: string;
  public abort?: () => void;

  constructor(options: HTTPFetchOptions) {
    super('http');

    const filename = new URL(options.url).pathname.replace('/', '');
    if (filename == '') throw new Error(`No valid filename can be infered from ${options.url}`);

    this.url = options.url;
    this.filename = filename;
  }

  public async fetch() {
    return new Promise<string>((resolve, reject) => {
      // Make initial http request
      this.fetched = 0;
      HTTPFetcher.got
        .stream(this.url, {
          throwHttpErrors: false,
          timeout: { lookup: 10000, connect: 10000, secureConnect: 10000, socket: 10000, send: 10000, response: 10000 },
        })
        .on('data', (data) => (this.fetched += data.length))
        .once('error', reject)
        .once('response', (response: Response) => {
          const end = (err?: any) => {
            this.abort = undefined;
            if (err) reject(err);
            response.request.destroy();
            resolve(this.filename);
          };
          this.abort = () => {
            this.aborted = true;
            end(new Error('Fetch aborted'));
          };

          if (Math.floor(response.statusCode / 100) !== 2) {
            return end(new Error(`Error fetching content from ${this.url} - HTTP status ${response.statusCode}`));
          }
          this.length = parseInt(response.headers['content-length'] || '', 10);
          if (!this.length) return end(new Error(`No Content-Length provided by ${this.url}`));

          // Create writestream to temporary file location
          pipeline(
            response.request,
            createWriteStream(path.resolve(Config.getConfig().storage?.transient_dir || Utils.getTemporaryDir(), this.filename), { mode: 0o644 }),
            (err) => {
              if (this.aborted) return;
              this.abort = undefined; // Can no longer abort once we get to this point
              if (err) return end(err);
              // Move completed file download to final location
              Utils.moveFile(
                path.resolve(Config.getConfig().storage?.transient_dir || Utils.getTemporaryDir(), this.filename),
                path.resolve(Config.getConfig().storage?.persistent_dir || '', this.filename),
              ).then(() => end());
            },
          );
        });
    });
  }

  public async abortFetch() {
    this.abort?.();
  }
}

Fetcher.registerFetcherType('http', HTTPFetcher);
