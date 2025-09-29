import { LevelDB } from '../clients/leveldb.js';
import { Episode } from '../models/episode.js';

export class WebServerUtility {
  public static async getEpisodeData() {
    const rawData = await LevelDB.list();
    rawData.forEach(([levelDbKey, data]) => {
      data.formatted = Episode.episodeFormattedName(data.showName, data.episode, data.version, data.resolution, data.groupName, data.crc);
      if (Episode.fetchingEpisodesCache[levelDbKey]) {
        data.progress = Episode.fetchingEpisodesCache[levelDbKey].getProgressString();
      } else {
        data.progress = data.state;
      }
    });
    return rawData.map((item) => item.pop());
  }
}
