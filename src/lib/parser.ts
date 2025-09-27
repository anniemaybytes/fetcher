import { IRCManager } from './clients/irc/manager.js';
import { Episode } from './models/episode.js';
import { Source } from './models/sources/source.js';
import { FetchOptions } from '../types.js';

import { Logger } from './logger.js';
const logger = Logger.get('EpisodeParser');

export class Parser {
  private static whitespaceReplaceRegex = /[_.]/g;
  private static crcRegex = /(..+)([a-f\d]{8}|[A-F\d]{8})(.*)/;
  private static episodeRegexes = [
    /.*(?:EP|E|S\d+E)(\d{2,4})(?!-)(v0?\d+)?/i,
    /.* Episode (\d{1,4})(?!-)(v0?\d+)?/i,
    /.*\W(?<![-([])(\d{2,4})(?![-)\]])(v0?\d+)?(?:\W|$)/i,
  ];
  private static unparseableCache: { [key: string]: boolean } = {};

  private static validResolutions = [
    '640x360',
    '720x480',
    '960x720',
    '704x396',
    '848x480',
    '1024x576',
    '480x360',
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
  private static convertedResolutions: any = {
    '480p': '848x480',
    '540p': '960x540',
    '1280x720': '720p',
    '1920x1080': '1080p',
  };

  private static warn(msg: string) {
    logger.warn(msg);
    IRCManager.controlAnnounce(`WARN: ${msg}`);
  }

  private static parseContainer(name: string, defaultContainer?: string) {
    let container = defaultContainer;
    const containerLocation = name.lastIndexOf('.');
    const parsedContainer = name.substring(containerLocation + 1).toLowerCase();

    // If container extension is missing or invalid
    if (containerLocation === -1 || parsedContainer.includes(' ')) {
      if (!defaultContainer) {
        Parser.warn(`Release missing container: ${name}`);
        return undefined;
      }
    } else {
      if (defaultContainer && parsedContainer !== defaultContainer) {
        Parser.warn(`Release has invalid extension (want ${defaultContainer}): ${name}`);
        return undefined;
      }
      name = name.substring(0, containerLocation);
      container = parsedContainer;
    }

    if (!container) return undefined;

    return { container, name };
  }

  private static parseResolution(name: string, defaultRes?: string) {
    for (const res of Parser.validResolutions) {
      const index = name.indexOf(res);
      if (index === -1) continue;
      return {
        resolution: Parser.convertedResolutions[res] || res,
        name: name.substring(0, index) + name.substring(index + res.length),
      };
    }

    if (defaultRes) {
      return {
        resolution: Parser.convertedResolutions[defaultRes] || defaultRes,
        name: name,
      };
    }

    return undefined;
  }

  // Parse a name and return an instance of Episode if it is wanted by the provided source
  public static parseWantedEpisode(name: string, fetchOptions: FetchOptions, source: Source) {
    // Do pre-checks
    if (!name) return undefined;
    if (name.endsWith('.torrent')) name = name.substring(0, name.length - 8);

    const originalName = name;
    if (Parser.unparseableCache[originalName]) return undefined;

    // Create the episode we will build
    const episode = new Episode();

    // Find matching show (if it exists)
    const show = source.group.findShow(name);
    if (!show || !show.releasers[source.group.key]) return undefined;

    episode.showName = show.name;
    episode.groupID = show.groupID;
    episode.media = show.releasers[source.group.key].media;
    episode.subbing = show.releasers[source.group.key].subbing;
    episode.groupName = source.group.name;
    episode.fetchType = source.fetchType;
    episode.fetchOptions = fetchOptions;

    // Parse container
    const parsedContainer = Parser.parseContainer(name, source.defaults.container?.toLowerCase());
    if (!parsedContainer) {
      Parser.unparseableCache[originalName] = true;
      return undefined;
    }

    episode.container = parsedContainer.container;

    // Parse resolution
    const resolutionParse = Parser.parseResolution(name, source.defaults.res);
    if (!resolutionParse) {
      Parser.warn(`Release has invalid or missing resolution: ${originalName}`);
      Parser.unparseableCache[originalName] = true;
      return undefined;
    }

    // Confirm we are looking for this resolution
    if (!show.wantedResolutions.includes(resolutionParse.resolution)) return undefined;

    episode.resolution = resolutionParse.resolution;
    name = resolutionParse.name.replace(Parser.whitespaceReplaceRegex, ' ');

    // Parse (possible) CRC
    episode.crc = undefined;
    const crcMatch = name.match(Parser.crcRegex);
    if (crcMatch) {
      episode.crc = crcMatch[2].toUpperCase();
      name = crcMatch[1] + crcMatch[3];
    }

    // Parse episode and (possible) version
    Parser.episodeRegexes.some((regex) => {
      const episodeMatch = name.replace(Parser.whitespaceReplaceRegex, ' ').match(regex);
      episode.episode = parseInt(episodeMatch?.[1] || '', 10);
      episode.version = episodeMatch?.[2] ? parseInt(episodeMatch[2].substr(1) || '', 10) : 1;

      return episode.episode && episode.version >= 0; // return after first possible match (prefering higher confidence matches)
    });

    if (!episode.episode || !(episode.version >= 0)) {
      const episodeParse = { episode: episode.episode, version: episode.version };
      Parser.warn(`Release has invalid episode or version, got ${JSON.stringify(episodeParse)}: ${originalName}`);
      Parser.unparseableCache[originalName] = true;
      return undefined;
    }

    return episode;
  }

  // For testing needs
  public static clearUnpasableCache() {
    Parser.unparseableCache = {};
  }
}
