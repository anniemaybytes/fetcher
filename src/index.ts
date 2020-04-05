import 'source-map-support/register';
import { Source } from './lib/models/sources/source';
import { Show } from './lib/models/show';
import { Group } from './lib/models/group';
import { Episode } from './lib/models/episode';
import { TorrentFetcher } from './lib/models/fetchers/torrentFetcher';
import { LevelDB } from './lib/clients/leveldb';
import { AnimeBytes } from './lib/clients/animebytes';
import { IRCManager } from './lib/clients/irc/ircManager';
import { ShowsReleasersFetcher } from './lib/clients/showfetcher';
import { startWebserver, stopWebserver } from './lib/webserver/server';
import { getLogger } from './lib/logger';
// Must be imported to initialize properly
import './lib/models/sources/ircSource';
import './lib/models/sources/rssSource';
import './lib/models/fetchers/httpFetcher';
import './lib/models/fetchers/torrentFetcher';
const logger = getLogger('main');

let refreshInterval: NodeJS.Timeout | undefined = undefined;
let currentRefreshTimer: NodeJS.Timeout | undefined = undefined;
let currentlyReloading = true;

const showsReloadTimePeriod = 1000 * 60 * 2; // 2 minutes
const sourcesRefreshPeriod = 1000 * 60 * 5; // 5 minutes

async function reloadShowsAndGroups() {
  try {
    currentlyReloading = true;
    logger.debug('Starting shows.json reload');
    if (await ShowsReleasersFetcher.reload()) {
      logger.info('shows.json changed; updating now');
      await Source.removeAllSources();
      Group.loadGroups(ShowsReleasersFetcher.releasersJSON); // This also creates the sources
      Show.loadShows(ShowsReleasersFetcher.showsJSON);
    }
    logger.debug('shows.json reload complete');
    currentlyReloading = false;
  } catch (e) {
    logger.error('Unexpected error reloading shows.json:', e);
  }
}

async function refreshSources() {
  // If currently reloading sources, check back in 15 seconds
  if (currentlyReloading) return (currentRefreshTimer = setTimeout(refreshSources, 15000));
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
  return (currentRefreshTimer = setTimeout(refreshSources, sourcesRefreshPeriod));
}

async function main() {
  logger.info('Starting fetcher');
  await AnimeBytes.initialize();
  await LevelDB.initialize();
  await startWebserver();
  await IRCManager.initialize();
  await Episode.restartEpisodeFetchingFromState();
  await reloadShowsAndGroups();
  await refreshSources();
  refreshInterval = setInterval(reloadShowsAndGroups, showsReloadTimePeriod);
}

let stopSignalReceived = false;
async function shutdown() {
  if (stopSignalReceived) {
    logger.error('Stop signal receieved multiple times - forcefully exiting without gracefully termination');
    process.exit(1);
  }
  stopSignalReceived = true;
  logger.info('Signal to stop received, shutting down');
  // Shutdown stuff here
  if (refreshInterval) clearInterval(refreshInterval);
  if (currentRefreshTimer) clearTimeout(currentRefreshTimer);
  await stopWebserver(); // Turn off the webserver
  await Source.removeAllSources(); // Disconnect all sources
  await IRCManager.shutdown(); // Disconnect from IRC networks
  await TorrentFetcher.shutdown(); // Shut down webtorrent
  await LevelDB.shutdown(); // Gracefully close DB
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((e) => logger.error('Uncaught fatal error:', e));
