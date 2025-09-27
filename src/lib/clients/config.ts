import { readFileSync } from 'fs';

import { ConfigFile } from '../../types.js';

import { Logger } from '../logger.js';
const logger = Logger.get('Config');

const configFilePath = 'config.json';

export class Config {
  public static configCache?: ConfigFile = undefined;

  public static getConfig() {
    if (!Config.configCache) Config.reloadConfig();
    return Config.configCache as ConfigFile;
  }

  public static reloadConfig() {
    // Using readFileSync intentionally here to make this a synchronous function
    try {
      Config.configCache = JSON.parse(readFileSync(configFilePath, 'utf8'));
    } catch (e) {
      logger.error(`Unable to load configuration file: ${e}`);
      Config.configCache = {} as ConfigFile;
    }
  }
}
