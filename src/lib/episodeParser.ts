import sanitizeFilename from 'sanitize-filename';
import { IRCManager } from './clients/irc/ircManager';
import { Episode } from './models/episode';
import { getLogger } from './logger';
import type { Source } from './models/sources/source';
import { FetchOptions } from '../types';
const logger = getLogger('EpisodeParser');

const whitespaceReplaceRegex = /[_.]/g;
const crcRegex = /(..+)([a-f\d]{8}|[A-F\d]{8})(.*)/;
const episodeRegex = /.*[^\w](?:EP|E|S\d+E)?(?<!-)(\d{2,4}|(?<=Episode\s)\d)(?!-)(v0?\d+)?(?:[^\w]|$)/i;
let unparseableCache: { [filename: string]: boolean } = {};

const validResolutions = [
  '640×360',
  '720x480',
  '960x720',
  '704x396',
  '848x480',
  '1024x576',
  '480×360',
  '640x480',
  '960x540',
  '1280x720',
  '1920x1080',
  '360p',
  '480p',
  '540p',
  '720p',
  '1080p',
];
const convertedResolutions: any = {
  '480p': '848x480',
  '540p': '960x540',
  '1280x720': '720p',
  '1920x1080': '1080p',
};

function warn(msg: string) {
  logger.warn(msg);
  IRCManager.controlAnnounce(`WARN: ${msg}`);
}

function parseContainer(filename: string, defaultContainer?: string) {
  let saveFileName = filename;
  let container = defaultContainer;
  const containerLocation = filename.lastIndexOf('.');
  const parsedContainer = filename.substring(containerLocation + 1).toLowerCase();
  // If container extension is missing or invalid
  if (containerLocation === -1 || parsedContainer.includes(' ')) {
    if (!defaultContainer) {
      warn(`Release missing container: ${filename}`);
      return undefined;
    }
    saveFileName += `.${defaultContainer}`;
  } else {
    if (defaultContainer && parsedContainer !== defaultContainer) {
      warn(`Release has invalid extension (want ${defaultContainer}): ${filename}`);
      return undefined;
    }
    filename = filename.substring(0, containerLocation);
    container = parsedContainer;
  }
  if (!container) return undefined;
  return { saveFileName, container, filename };
}

function parseResolution(filename: string, defaultRes?: string) {
  for (const res of validResolutions) {
    const index = filename.indexOf(res);
    if (index === -1) continue;
    return {
      resolution: convertedResolutions[res] || res,
      filename: filename.substring(0, index) + filename.substring(index + res.length),
    };
  }
  if (defaultRes)
    return {
      resolution: convertedResolutions[defaultRes] || defaultRes,
      filename,
    };
  return undefined;
}

// Parse a filename and return an instance of Episode if it is wanted by the provided source
export function parseWantedEpisode(filename: string, fetchOptions: FetchOptions, source: Source) {
  // Do pre-checks
  if (!filename) return undefined;
  if (filename.endsWith('.torrent')) filename = filename.substring(0, filename.length - 8);
  const originalFilename = filename;
  if (unparseableCache[originalFilename]) return undefined;
  // Create the episode we will build
  const episode = new Episode();
  // Find matching show (if it exists)
  const show = source.group.findShow(filename);
  if (!show || !show.releasers[source.group.key]) return undefined;
  episode.showName = show.name;
  episode.groupID = show.groupID;
  episode.media = show.releasers[source.group.key].media;
  episode.subbing = show.releasers[source.group.key].subbing;
  episode.groupName = source.group.name;
  episode.fetchType = source.fetchType;
  episode.fetchOptions = fetchOptions;
  // Parse container
  const parsedContainer = parseContainer(filename, source.defaults.container?.toLowerCase());
  if (!parsedContainer) {
    unparseableCache[originalFilename] = true;
    return undefined;
  }
  episode.container = parsedContainer.container;
  episode.saveFileName = sanitizeFilename(parsedContainer.saveFileName);
  filename = parsedContainer.filename;
  // Parse (possible) CRC
  episode.crc = undefined;
  const crcMatch = filename.replace(whitespaceReplaceRegex, ' ').match(crcRegex);
  if (crcMatch) {
    episode.crc = crcMatch[2].toUpperCase();
    filename = crcMatch[1] + crcMatch[3];
  }
  // Parse resolution
  const resolutionParse = parseResolution(filename, source.defaults.res);
  if (!resolutionParse) {
    warn(`Release has invalid or missing resolution: ${originalFilename}`);
    unparseableCache[originalFilename] = true;
    return undefined;
  }
  // Confirm we are looking for this resolution
  if (!show.wantedResolutions.includes(resolutionParse.resolution)) return undefined;
  episode.resolution = resolutionParse.resolution;
  filename = resolutionParse.filename;
  // Parse episode and (possible) version
  const episodeMatch = filename.replace(whitespaceReplaceRegex, ' ').match(episodeRegex);
  episode.episode = parseInt(episodeMatch?.[1] || '', 10);
  episode.version = episodeMatch?.[2] ? parseInt(episodeMatch[2].substr(1) || '', 10) : 1;
  if (episode.version && episode.version > 9) episode.version = 1;
  if (!episode.episode || !(episode.version >= 0)) {
    const episodeParse = { episode: episode.episode, version: episode.version };
    warn(`Release has invalid episode or version. Got ${JSON.stringify(episodeParse)}: ${originalFilename}`);
    unparseableCache[originalFilename] = true;
    return undefined;
  }
  return episode;
}

// For testing needs
export function clearUnpasableCache() {
  unparseableCache = {};
}
