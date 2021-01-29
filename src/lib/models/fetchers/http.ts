import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream';
import got, { Response } from 'got';
import { Fetcher } from './fetcher';
import { Config } from '../../clients/config';
import { HTTPFetchOptions } from '../../../types';

export class HTTPFetcher extends Fetcher {
  public static got = got; // For testing purposes
  url: string;
  abort?: () => void;

  constructor(path: string, options: HTTPFetchOptions) {
    super('http', path);
    this.url = options.url;
  }

  public async fetch() {
    return new Promise<void>((resolve, reject) => {
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
            resolve();
          };
          this.abort = () => {
            this.aborted = true;
            end(new Error('Fetch aborted'));
          };

          if (Math.floor(response.statusCode / 100) !== 2)
            return end(new Error(`Error fetching HTTP content from ${this.url} - HTTP status ${response.statusCode}`));
          this.length = parseInt(response.headers['content-length'] || '', 10);
          if (!this.length) return end(new Error(`No content-length provided by ${this.url}`));
          // Create writestream to temporary file location
          const tempFilePath = path.resolve(Config.getConfig().temporary_dir || '/tmp', path.basename(this.path));
          pipeline(response.request, fs.createWriteStream(tempFilePath, { mode: 0o644 }), (err) => {
            if (this.aborted) return;
            this.abort = undefined; // Can no longer abort once we get to this point
            if (err) return end(err);
            // Move completed file download to final location
            fs.rename(tempFilePath, this.path, end);
          });
        });
    });
  }

  public async abortFetch() {
    this.abort?.();
  }
}

Fetcher.registerFetcherType('http', HTTPFetcher);
