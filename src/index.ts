import 'source-map-support/register';
import { Source } from './lib/models/sources/source';
import { Episode } from './lib/models/episode';
import { TorrentFetcher } from './lib/models/fetchers/torrent';
import { LevelDB } from './lib/clients/leveldb';
import { AnimeBytes } from './lib/clients/animebytes';
import { IRCManager } from './lib/clients/irc/manager';
import { startWebserver, stopWebserver } from './lib/webserver/server';
import { Reloader } from './lib/reloader';
import { getLogger } from './lib/logger';
// Must be imported to initialize properly
import './lib/models/sources/ircSource';
import './lib/models/sources/rssSource';
import './lib/models/fetchers/httpFetcher';
import './lib/models/fetchers/torrentFetcher';
const logger = getLogger('main');

async function main() {
  logger.info('Starting fetcher');
  await AnimeBytes.initialize();
  await LevelDB.initialize();
  await startWebserver();
  await IRCManager.initialize();
  await Episode.restartEpisodeFetchingFromState();
  await Reloader.startRefreshAndReloads();
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
  await Reloader.shutdownReloading();
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
