import { LevelDB } from '../clients/leveldb.js';
import { Episode } from '../models/episode.js';

export class WebServerUtility {
  public static async getEpisodeData() {
    const rawData = await LevelDB.list();
    rawData.forEach((data) => {
      data.formatted = Episode.episodeFormattedName(
        data.showName,
        data.episode,
        data.version,
        data.resolution,
        data.groupName,
        data.container,
        data.crc,
      );
      if (Episode.fetchingEpisodesCache[data.saveFileName] && Episode.fetchingEpisodesCache[data.saveFileName].formattedName() === data.formatted) {
        data.progress = Episode.fetchingEpisodesCache[data.saveFileName].getProgressString();
      } else {
        data.progress = data.state;
      }
    });
    return rawData;
  }
}
