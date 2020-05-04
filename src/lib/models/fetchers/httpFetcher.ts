import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import { Fetcher } from './fetcher';
import { Config } from '../../clients/config';
import { HTTPFetchOptions } from '../../../types';

export class HTTPFetcher extends Fetcher {
  public static nodefetch = fetch; // For testing purposes
  url: string;
  abort?: () => void;

  constructor(path: string, options: HTTPFetchOptions) {
    super('http', path);
    this.url = options.url;
  }

  public async fetch() {
    return new Promise<void>((resolve, reject) => {
      // Make initial http request
      const abortController = new AbortController();
      HTTPFetcher.nodefetch(this.url, { signal: abortController.signal, timeout: 10000 })
        .then((response) => {
          if (!response.ok) return reject(new Error(`Error fetching HTTP content from ${this.url} - HTTP status ${response.status}`));
          const body = response.body as NodeJS.ReadStream;

          // Reject if content-length is not provided
          this.length = parseInt(response.headers.get('Content-Length') || '', 10);
          if (!this.length) return reject(new Error(`No content-length provided by ${this.url}`));
          this.fetched = 0;
          // Create writestream to temporary file location
          const tempFilePath = path.resolve(Config.getConfig().temporary_dir || '/tmp', path.basename(this.path));
          const writeStream = fs.createWriteStream(tempFilePath, { mode: 0o644 });

          // Set up error detector
          let lastFetched = this.fetched;
          let interval: NodeJS.Timeout | undefined = undefined;
          this.abort = () => {
            if (interval) clearInterval(interval);
            interval = undefined;
            abortController.abort();
            body.destroy();
          };
          const abortChecking = () => {
            if (lastFetched === this.fetched) this.abort?.();
            lastFetched = this.fetched;
          };
          interval = setInterval(abortChecking, 10000); // If http request doesn't get any new bytes for 10 seconds, consider it a failure

          // Set up listeners on request body to write and resolve file
          body.on('data', (data) => {
            this.fetched += data.length;
          });
          body.on('error', (err) => {
            if (interval) clearInterval(interval);
            this.abort = undefined;
            writeStream.destroy();
            reject(new Error(`Error fetching from ${this.url} ${err}`));
          });
          body.on('close', () => {
            if (interval) clearInterval(interval);
            this.abort = undefined;
            writeStream.end(() => {
              if (this.aborted) return reject(new Error('Fetch aborted'));
              if (this.length < this.fetched) return reject(new Error(`Fetched past EOF from ${this.url}`));
              if (this.length > this.fetched) return reject(new Error(`Unexpected EOF from ${this.url}`));
              // Move completed file to final destination
              fs.rename(tempFilePath, this.path, (err) => {
                if (this.aborted) return reject(new Error('Fetch aborted'));
                if (err) reject(err);
                else resolve();
              });
            });
          });
          body.pipe(writeStream, { end: false });
        })
        .catch(reject);
    });
  }

  public async abortFetch() {
    this.aborted = true;
    this.abort?.();
  }
}

Fetcher.registerFetcherType('http', HTTPFetcher);
