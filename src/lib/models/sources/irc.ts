import { Source } from './source.js';
import { Group } from '../group.js';
import { Parser } from '../../parser.js';
import { IRCManager } from '../../clients/irc/manager.js';
import { ReleaserIRCOptions, MessageEvent } from '../../../types.js';

import { Logger } from '../../logger.js';
const logger = Logger.get('IRCSource');

interface MessageCache {
  lastUpdated: Date;
  messages: string[];
}

interface Matcher {
  regex: RegExp;
  matchNames: string[];
}

export class IRCSource extends Source {
  // Public for testing purposes
  public listenerClosers: any[];
  public msgCache: { [channelAndNick: string]: MessageCache };
  public multiLine: number;
  public network: string;
  public nicks: string[];
  public matchers: Matcher[];

  constructor(group: Group, fetchType: string, options: ReleaserIRCOptions) {
    super('irc', fetchType, options.meta || {}, group);
    this.listenerClosers = [];
    this.msgCache = {};
    this.matchers = [];
    if (!IRCManager.hasNetwork(options.network)) throw new Error(`Requested IRC network ${options.network} for group ${group.name} not defined`);
    this.network = options.network;
    this.nicks = options.nicks.map((nick) => nick.toLowerCase());
    options.matchers.forEach((matcher) => {
      this.matchers.push({
        regex: new RegExp(matcher[0], 'i'),
        matchNames: matcher.slice(1),
      });
    });
    this.multiLine = options.multiline || 1;
    this.initialize(options.channels);
  }

  public async initialize(channels: string[]) {
    const closers = await Promise.all(
      channels.map(async (channel) => IRCManager.addChannelWatcher(this.network, channel, this.messageCallback.bind(this)))
    );
    closers.forEach((closer) => this.listenerClosers.push(closer));
  }

  public async messageCallback(event: MessageEvent) {
    try {
      if (this.nicks.includes(event.nick.toLowerCase())) {
        const msgCacheKey = `${event.target}|${event.nick}`;
        let msgCache: any = {};
        // Check if existing (valid) cache exists (don't link together messages that appeared more than 10 seconds apart)
        if (this.msgCache[msgCacheKey] && Date.now() - this.msgCache[msgCacheKey].lastUpdated.getTime() < 10000) {
          msgCache = this.msgCache[msgCacheKey];
        } else {
          msgCache.messages = [];
        }
        msgCache.lastUpdated = new Date();
        msgCache.messages.push(event.message);
        if (msgCache.messages.length >= this.multiLine) {
          delete this.msgCache[msgCacheKey];
          // Parse the message now that we have all of the lines from a specified channel/nick
          await this.parseMessage(msgCache.messages.join('\n'));
        } else {
          this.msgCache[msgCacheKey] = msgCache;
        }
      }
    } catch (e) {
      logger.error('Unexpected error parsing IRC message:', e);
    }
  }

  private async parseMessage(messageAggregate: string) {
    for (const matcher of this.matchers) {
      const matches = messageAggregate.match(matcher.regex);
      if (matches) {
        const params: any = {};
        matcher.matchNames.forEach((paramName, index) => {
          params[paramName] = matches[index + 1];
        });
        if (!params.file || !params.link)
          logger.error(`Could not find file and/or link parameter in message regex; possibly broken IRC matcher for ${this.group.name}`);
        const episode = Parser.parseWantedEpisode(params.file, this.getFetcherOptions(params.link), this);
        if (episode) {
          episode.fetchEpisode();
          return;
        }
      }
    }
  }

  public close() {
    this.listenerClosers.forEach((fn) => fn());
    this.listenerClosers = [];
  }

  public fetch() {}
}

Source.registerSourceType('irc', IRCSource);
