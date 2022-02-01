import { readFileSync } from 'fs';

import { ConfigFile } from '../../types.js';

const configFilePath = 'config.json';

export class Config {
  public static configCache?: ConfigFile = undefined;

  public static getConfig() {
    if (!Config.configCache) Config.reloadConfig();
    return Config.configCache as ConfigFile;
  }

  public static reloadConfig() {
    // Using readFileSync intentionally here to make this a synchronous function
    Config.configCache = JSON.parse(readFileSync(configFilePath, 'utf8'));
  }
}
