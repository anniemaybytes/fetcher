import path from 'path';

import { Utils } from '../utils.js';
import { Config } from '../clients/config.js';
import { LevelDB } from '../clients/leveldb.js';
import { IRCManager } from '../clients/irc/manager.js';
import { ABClient } from '../clients/animebytes.js';
import { MediaInfo } from '../clients/mediainfo.js';
import { MkTorrent } from '../clients/mktorrent.js';
import { Fetcher } from './fetchers/fetcher.js';
import { FetchOptions } from '../../types.js';

import { Logger } from '../logger.js';
const logger = Logger.get('EpisodeModel');

type fetchStatus = 'complete' | 'fetching' | 'uploading' | 'failed';

export class Episode {
  public static fetchingEpisodesCache: { [key: string]: Episode } = {};

  public episode: number;
  public version: number;
  public resolution: string;
  public crc?: string;
  public showName: string;
  public groupID: string;
  public media: string;
  public subbing: string;
  public groupName: string;
  public fetchType: string;
  public fetchOptions: FetchOptions;
  public formattedEpisodeName?: string;
  public fetcher?: Fetcher;
  public state?: fetchStatus;

  public static async start() {
    (await LevelDB.list()).forEach(([, data]) => {
      if (data.state && data.state !== 'complete') {
        const episode = Episode.fromStorageJSON(data);
        episode.fetchEpisode();
      }
    });
  }

  public async isAlreadyComplete() {
    try {
      const existingState = await LevelDB.get(this.levelDBKey());
      return existingState.state === 'complete';
    } catch (e) {
      if (e.code === 'LEVEL_NOT_FOUND') return false;
      logger.error(`Error checking LevelDB for ${this.formattedName()}; can't determine state:`, e);
      return true;
    }
  }

  public async fetchEpisode() {
    // Exit early if we're running in test mode
    if (process.env.DISABLE_FETCHER) return;
    // Don't do anything if another instance of episode exists for this episode that's already fetching
    if (Episode.fetchingEpisodesCache[this.levelDBKey()]) return;
    // Check if this is already marked as completed in state
    if (await this.isAlreadyComplete()) return;
    // Actually fetch the episode
    try {
      logger.info(`Starting fetch for ${this.formattedName()}`);
      this.fetcher = Fetcher.createFetcher(this.fetchType, this.fetchOptions);
      const promise = this.fetcher.fetch();
      Episode.fetchingEpisodesCache[this.levelDBKey()] = this;
      await this.saveToState('fetching');
      IRCManager.controlAnnounce(`AIRING | fetching: ${this.formattedName()}`);
      const resolvedFileName = await promise;

      // Fetch is complete, get mediainfo, create torrent, and upload
      logger.info(`Finished fetch for ${this.formattedName()}; gathering metadata and uploading`);
      await this.saveToState('uploading');
      const mediaInfo = await MediaInfo.get(path.resolve(Config.getConfig().storage?.persistent_dir || '', resolvedFileName));
      const torrentPath = path.resolve(Utils.getTemporaryDir(), `${this.formattedName()}.torrent`);
      await MkTorrent.make(torrentPath, path.resolve(Config.getConfig().storage?.persistent_dir || '', resolvedFileName));
      await Utils.retry((async () => await ABClient.upload(this, mediaInfo, torrentPath)).bind(this), 3, 30000);
      await Utils.moveFile(torrentPath, path.resolve(Config.getConfig().storage?.torrents_dir || '', `${this.formattedName()}.torrent`));

      // Upload is complete, finish up
      logger.info(`Upload complete for ${this.formattedName()}`);
      delete Episode.fetchingEpisodesCache[this.levelDBKey()];
      await this.saveToState('complete');
      IRCManager.controlAnnounce(`AIRING | completed: ${this.formattedName()}`);
    } catch (e) {
      delete Episode.fetchingEpisodesCache[this.levelDBKey()];
      if (this.fetcher?.aborted) return; // If the fetch was aborted, we do not want to save failed state
      logger.error(`Failed to fetch or upload ${this.formattedName()}`, e);
      await this.saveToState('failed', String(e));
      IRCManager.controlAnnounce(`AIRING | errored: ${this.formattedName()} - ${e}`);
    }
  }

  // Note that this will fail for an episode in the 'uploading' state as it is not currently possible to abort at this stage
  public async abortAndDelete() {
    // if fetcher exists on this instance, it may need to be aborted before deleting from state
    if (this.fetcher) {
      if (this.state === 'uploading') throw new Error('Cannot abort fetching episode in uploading state');
      logger.info(`Aborting fetch for ${this.formattedName()}`);
      await this.fetcher.abortFetch();
    }
    logger.info(`Deleting state for ${this.formattedName()}`);
    await this.deleteFromState();
  }

  public formattedName() {
    if (this.formattedEpisodeName) return this.formattedEpisodeName;
    this.formattedEpisodeName = Episode.episodeFormattedName(this.showName, this.episode, this.version, this.resolution, this.groupName, this.crc);
    return this.formattedEpisodeName;
  }

  public static episodeFormattedName(showName: string, episode: number, version: number, resolution: string, groupName: string, crc?: string) {
    let formatted = `${showName} - ${episode.toString().padStart(2, '0')}`;
    if (version !== 1) formatted += `v${version}`;
    formatted += ` [${resolution}][${groupName}]`;
    if (crc) formatted += `[${crc}]`;
    return formatted;
  }

  public levelDBKey() {
    return `file::${this.formattedName()}`;
  }

  public async deleteFromState() {
    await LevelDB.delete(this.levelDBKey());
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
      if (e.code !== 'LEVEL_NOT_FOUND') throw e; // Ignore NotFoundError
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
      crc: this.crc,
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
    episode.crc = storageJSON.crc;
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
