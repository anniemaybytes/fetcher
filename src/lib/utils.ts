import { existsSync, mkdirSync, promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { Logger } from './logger.js';
const logger = Logger.get('Utils');

export class Utils {
  public static async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  public static async timeoutPromise(promise: Promise<any>, timeout: number, err: any) {
    let timer: NodeJS.Timeout;
    return Promise.race([
      new Promise((resolve, reject) => (timer = setTimeout(() => reject(err), timeout))),
      promise.finally(() => clearTimeout(timer)),
    ]);
  }

  public static async retry<T>(fn: () => T | Promise<T>, retries = 3, waitMs = 3000): Promise<T> {
    let lastError = new Error('Retry count cannot be less than 0');
    for (let i = 0; i <= retries; i++) {
      try {
        await Utils.sleep(waitMs * i);
        return await fn();
      } catch (e) {
        lastError = e;
        // Log error as warning, but not on the last iteration since we will throw it
        if (i !== retries) logger.warn(`Error while retrying [will retry]: ${e}`);
      }
    }
    throw lastError;
  }

  public static async moveFile(oldPath: string, newPath: string): Promise<void> {
    try {
      await fs.rename(oldPath, newPath);
    } catch (e) {
      if (e.code === 'EXDEV') {
        await fs.copyFile(oldPath, newPath);
        await fs.unlink(oldPath);
      } else throw e;
    }
  }

  public static getTemporaryDir(): string {
    const tempPath = path.resolve(os.tmpdir(), 'fetcher2');
    if (!existsSync(tempPath)) mkdirSync(tempPath);
    return tempPath;
  }
}
