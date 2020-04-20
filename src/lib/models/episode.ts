import path from 'path';
import { Config } from '../clients/config';
import { LevelDB } from '../clients/leveldb';
import { IRCManager } from '../clients/irc/ircManager';
import { AnimeBytes } from '../clients/animebytes';
import { getMediaInfo } from '../clients/mediainfo';
import { makeTorrentFile } from '../clients/mktorrent';
import { Fetcher } from './fetchers/fetcher';
import { getLogger } from '../logger';
import { FetchOptions } from '../../types';
const logger = getLogger('EpisodeModel');

type fetchStatus = 'complete' | 'fetching' | 'uploading' | 'failed';

export class Episode {
  public static fetchingEpisodesCache: { [key: string]: Episode } = {};
  episode: number;
  version: number;
  resolution: string;
  container: string;
  crc?: string;
  saveFileName: string;
  showName: string;
  groupID: string;
  media: string;
  subbing: string;
  groupName: string;
  fetchType: string;
  fetchOptions: FetchOptions;
  formattedFileName?: string;
  fetcher?: Fetcher;
  state?: fetchStatus;

  public static async restartEpisodeFetchingFromState() {
    (await LevelDB.list()).forEach((item) => {
      if (item.state && item.state !== 'complete') {
        const episode = Episode.fromStorageJSON(item);
        episode.fetchEpisode();
      }
    });
  }

  public async isAlreadyComplete() {
    try {
      const existingState = await LevelDB.get(this.levelDBKey());
      return existingState.state === 'complete';
    } catch (e) {
      // Ignore NotFoundError (new item)
      if (e.type === 'NotFoundError') return false;
      logger.error(`Error checking LevelDB for ${this.formattedName()}; can't determine state:`, e);
      return true;
    }
  }

  public async fetchEpisode() {
    // Don't do anything if another instance of episode exists for this episode that's already fetching
    if (Episode.fetchingEpisodesCache[this.saveFileName]) return;
    // Check if this is already marked as completed in state
    if (await this.isAlreadyComplete()) return;
    // Actually fetch the episode
    try {
      logger.info(`Starting fetch for ${this.saveFileName}`);
      this.fetcher = Fetcher.createFetcher(this.fetchType, this.getStoragePath(), this.fetchOptions);
      const promise = this.fetcher.fetch();
      Episode.fetchingEpisodesCache[this.saveFileName] = this;
      await this.saveToState('fetching');
      IRCManager.controlAnnounce(`AIRING | fetching: ${this.saveFileName}`);
      await promise;

      // Fetch is complete, get mediainfo, create torrent, and upload
      logger.info(`Finished fetch for ${this.saveFileName}; gathering metadata and uploading`);
      await this.saveToState('uploading');
      const mediaInfo = await getMediaInfo(this.getStoragePath(), this.saveFileName);
      await makeTorrentFile(this);
      await AnimeBytes.upload(this, mediaInfo);

      // Upload is complete, finish up
      logger.info(`Upload complete for ${this.saveFileName}`);
      delete Episode.fetchingEpisodesCache[this.saveFileName];
      await this.saveToState('complete');
      IRCManager.controlAnnounce(`AIRING | completed: ${this.saveFileName}`);
    } catch (e) {
      logger.error(`Failed to fetch or upload ${this.saveFileName}`, e);
      delete Episode.fetchingEpisodesCache[this.saveFileName];
      await this.saveToState('failed', String(e));
      IRCManager.controlAnnounce(`AIRING | errored: ${this.saveFileName} - ${e}`);
    }
  }

  public getStoragePath() {
    return path.resolve(Config.getConfig().storage_dir || '', this.saveFileName);
  }

  public getTorrentPath() {
    return path.resolve(Config.getConfig().torrent_dir || '', `${this.saveFileName}.torrent`);
  }

  public formattedName() {
    if (this.formattedFileName) return this.formattedFileName;
    let formatted = `${this.showName} - ${this.episode.toString().padStart(2, '0')}`;
    if (this.version > 1) formatted += `v${this.version}`;
    formatted += ` [${this.resolution}][${this.groupName}]`;
    if (this.crc) formatted += `[${this.crc}]`;
    formatted += `.${this.container}`;
    this.formattedFileName = formatted;
    return this.formattedFileName;
  }

  public levelDBKey() {
    return `file::${this.formattedName()}`;
  }

  public async saveToState(status: fetchStatus, error?: string) {
    this.state = status;
    const key = this.levelDBKey();
    const now = new Date().toUTCString();
    let lastState = '';
    let createTime = now;
    try {
      const current = await LevelDB.get(key);
      lastState = current.state;
      createTime = current.created;
    } catch (e) {
      if (e.type !== 'NotFoundError') throw e; // Ignore NotFoundError
    }
    await LevelDB.put(key, { ...this.asStorageJSON(), lastState, state: status, created: createTime, modified: now, error });
  }

  public getProgressString() {
    if (!this.state) return 'pending';
    let message = this.state;
    if (this.state !== 'fetching' || !this.fetcher || !this.fetcher.length) return message;
    const fetchedMB = (this.fetcher.fetched / 1024 / 1024).toFixed(1);
    const lengthMB = (this.fetcher.length / 1024 / 1024).toFixed(1);
    const percent = ((this.fetcher.fetched / this.fetcher.length) * 100).toFixed(2);
    message += ` - ${fetchedMB}MB/${lengthMB}MB (${percent}%)`;
    return message;
  }

  public asStorageJSON() {
    return {
      showName: this.showName,
      episode: this.episode,
      version: this.version,
      resolution: this.resolution,
      container: this.container,
      crc: this.crc,
      saveFileName: this.saveFileName,
      groupID: this.groupID,
      media: this.media,
      subbing: this.subbing,
      groupName: this.groupName,
      fetchType: this.fetchType,
      fetchOptions: this.fetchOptions,
    };
  }

  public static fromStorageJSON(storageJSON: any) {
    const episode = new Episode();
    episode.episode = storageJSON.episode;
    episode.version = storageJSON.version;
    episode.resolution = storageJSON.resolution;
    episode.container = storageJSON.container;
    episode.crc = storageJSON.crc;
    episode.saveFileName = storageJSON.saveFileName;
    episode.showName = storageJSON.showName;
    episode.groupID = storageJSON.groupID;
    episode.media = storageJSON.media;
    episode.subbing = storageJSON.subbing;
    episode.groupName = storageJSON.groupName;
    episode.fetchType = storageJSON.fetchType;
    episode.fetchOptions = storageJSON.fetchOptions;
    return episode;
  }
}
