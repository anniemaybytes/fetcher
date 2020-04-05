import level from 'level';
import type { LevelUp } from 'levelup';
import { Config } from './config';

export class LevelDB {
  public static db: LevelUp; // Only public for testing. Not to be used directly outside of this class

  // Must be called before other methods (on startup)
  public static async initialize() {
    LevelDB.db = level(Config.getConfig().state_db || 'state.ldb', { valueEncoding: 'json' });
  }

  public static get(key: string) {
    return LevelDB.db.get(key);
  }

  public static async put(key: string, value: any) {
    return LevelDB.db.put(key, value);
  }

  public static async delete(key: string) {
    return LevelDB.db.del(key);
  }

  public static async list() {
    return new Promise<any[]>((resolve, reject) => {
      const stream = LevelDB.db.createValueStream();
      const data: any[] = [];
      stream.on('error', reject);
      stream.on('data', (val) => data.push(val));
      stream.on('end', () => resolve(data));
    });
  }

  public static async shutdown() {
    await LevelDB.db.close();
  }
}
