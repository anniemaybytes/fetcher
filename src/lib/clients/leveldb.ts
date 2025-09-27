import { Level } from 'level';
import { Config } from './config.js';

export class LevelDB {
  public static db: Level; // Only public for testing. Not to be used directly outside of this class

  // Must be called before other methods (on startup)
  public static async initialize(imp: any /* for testing */ = Level) {
    LevelDB.db = new imp(Config.getConfig().state_db || 'state.ldb', { valueEncoding: 'json' });
  }

  public static get(key: string): any {
    return LevelDB.db.get(key);
  }

  public static async put(key: string, value: any) {
    return LevelDB.db.put(key, value);
  }

  public static async delete(key: string) {
    return LevelDB.db.del(key);
  }

  public static async list(): Promise<any[]> {
    return LevelDB.db.iterator().all();
  }

  public static async shutDown() {
    await LevelDB.db.close();
  }
}
