import 'source-map-support/register.js';

import { Source } from './lib/models/sources/source.js';
import { Episode } from './lib/models/episode.js';
import { TorrentFetcher } from './lib/models/fetchers/torrent.js';
import { LevelDB } from './lib/clients/leveldb.js';
import { ABClient } from './lib/clients/animebytes.js';
import { IRCManager } from './lib/clients/irc/manager.js';
import { WebServer } from './lib/webserver/server.js';
import { Reloader } from './lib/reloader.js';

// Must be imported to initialize properly
import './lib/models/sources/irc.js';
import './lib/models/sources/rss.js';
import './lib/models/fetchers/http.js';
import './lib/models/fetchers/torrent.js';

import { Logger } from './lib/logger.js';
const logger = Logger.get('main');

async function main() {
  logger.info('Starting fetcher');

  await ABClient.initialize();
  await LevelDB.initialize();
  await WebServer.start();
  await IRCManager.initialize();
  await Episode.start();
  await Reloader.start();
}

let stopSignalReceived = false;
async function shutDown() {
  if (stopSignalReceived) {
    logger.error('Stop signal receieved multiple times - forcefully exiting without gracefully termination');
    process.exit(1);
  }

  logger.info('Signal to stop received, shutting down');
  stopSignalReceived = true;

  // Shutdown stuff here
  await Reloader.shutDown();
  await WebServer.shutDown(); // Turn off the webserver
  await Source.removeAllSources(); // Disconnect all sources
  await IRCManager.shutDown(); // Disconnect from IRC networks
  await TorrentFetcher.shutDown(); // Shut down webtorrent
  await LevelDB.shutDown(); // Gracefully close DB

  process.exit(0);
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

main().catch((e) => logger.error('Uncaught fatal error:', e));
