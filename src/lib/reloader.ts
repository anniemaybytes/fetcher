import { Source } from './models/sources/source.js';
import { Show } from './models/show.js';
import { Group } from './models/group.js';
import { ShowsReleasersFetcher } from './clients/fetcher.js';

import { Logger } from './logger.js';
const logger = Logger.get('Reloader');

const showsReloadTimePeriod = 1000 * 60 * 2; // 2 minutes
const sourcesRefreshPeriod = 1000 * 60 * 5; // 5 minutes

export class Reloader {
  // All properties public for testing only
  public static currentReloadTimer: NodeJS.Timeout | undefined = undefined;
  public static currentRefreshTimer: NodeJS.Timeout | undefined = undefined;
  public static currentlyReloading = true;

  public static async reloadShowsAndGroups() {
    // Ensure only one active timer for this function
    if (Reloader.currentReloadTimer) clearTimeout(Reloader.currentReloadTimer);
    Reloader.currentlyReloading = true;
    try {
      logger.debug('Starting shows definition reload');
      if (await ShowsReleasersFetcher.reload()) {
        logger.info('Shows definition changed; updating now');
        await Source.removeAllSources();
        Group.loadGroups(ShowsReleasersFetcher.releasersJSON); // This also creates the sources
        Show.loadShows(ShowsReleasersFetcher.showsJSON);
      }
      logger.debug('Shows definition reload complete');
    } catch (e) {
      logger.error('Unexpected error reloading shows definition:', e);
    }
    Reloader.currentlyReloading = false;
    // clear (if necessary) and set new timeout as atomically as possible
    if (Reloader.currentReloadTimer) clearTimeout(Reloader.currentReloadTimer);
    Reloader.currentReloadTimer = setTimeout(Reloader.reloadShowsAndGroups, showsReloadTimePeriod);
  }

  public static async refreshSources() {
    // Ensure only one active timer for this function
    if (Reloader.currentRefreshTimer) clearTimeout(Reloader.currentRefreshTimer);
    // If currently reloading sources, check back in 15 seconds
    if (Reloader.currentlyReloading) {
      Reloader.currentRefreshTimer = setTimeout(Reloader.refreshSources, 15000);
      return;
    }
    logger.debug('Starting sources refresh');
    try {
      for (const source of Source.activeSources) {
        try {
          await source.fetch();
        } catch (e) {
          logger.warn(`Error fetching from ${source.group.name} ${source.type} source:`, e);
        }
      }
    } catch (e) {
      logger.error('Unexpected (fatal) error fetching sources; not all sources refreshed:', e);
    }
    logger.debug('Sources refresh complete');
    // clear (if necessary) and set new timeout as atomically as possible
    if (Reloader.currentRefreshTimer) clearTimeout(Reloader.currentRefreshTimer);
    Reloader.currentRefreshTimer = setTimeout(Reloader.refreshSources, sourcesRefreshPeriod);
  }

  public static async start() {
    await Reloader.reloadShowsAndGroups();
    await Reloader.refreshSources();
  }

  public static async shutDown() {
    if (Reloader.currentReloadTimer) clearTimeout(Reloader.currentReloadTimer);
    if (Reloader.currentRefreshTimer) clearTimeout(Reloader.currentRefreshTimer);
  }
}
