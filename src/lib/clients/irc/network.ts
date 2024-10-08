import * as irc from 'irc-framework';
import colors from 'irc-colors';

import { Utils } from '../../utils.js';
import { IRCNetworkConfig, MessageEvent } from '../../../types.js';

import { Logger } from '../../logger.js';
const logger = Logger.get('IRCNetwork');

export class IRCNetwork {
  // For testing purposes
  public static client = irc.Client;

  // Public for testing purposes
  public name: string;
  public bot: any;
  public connectOptions: any;
  public nickservPassword?: string;
  public registered = false;
  public shuttingDown = false;
  public previouslyJoinedChannels: Set<string>;
  public joinedChannels: string[];

  private static nickServPasswordAcceptedRegex = /Password accepted/i;

  constructor(name: string, options: IRCNetworkConfig) {
    this.previouslyJoinedChannels = new Set();
    this.joinedChannels = [];
    this.name = name;
    this.nickservPassword = options.nickserv_password;

    const targetNick = options.nickname.replace(/\$/g, Math.random().toString(36).substr(7, 3));
    this.connectOptions = {
      host: options.address,
      port: options.port || 6667,
      nick: targetNick,
      username: targetNick,
      gecos: targetNick,
      ssl: options.use_ssl === undefined ? false : options.use_ssl,
      rejectUnauthorized: options.verify_ssl === undefined ? true : options.verify_ssl,
    };

    // Reconnection handled manually otherwise messages can be dropped when not connected
    this.bot = new IRCNetwork.client({ auto_reconnect: false });

    this.bot.on('nick in use', () =>
      logger.error(`Attempted IRC nickname ${this.connectOptions.nick} is currently in use on ${this.name}; will retry`),
    );
    this.bot.on('close', () => {
      if (this.registered && !this.shuttingDown) logger.error(`Disconnected from IRC server ${this.name}`);
      this.registered = false;
    });
    this.bot.on('registered', async () => {
      await this.postConnect();
    });

    this.connect();
  }

  // public for testing purposes only
  public async postConnect() {
    this.joinedChannels = [];

    if (this.nickservPassword) {
      const nicservNoticeHandler = (event: any) => {
        if (event.nick.toLowerCase() === 'nickserv') {
          if (IRCNetwork.nickServPasswordAcceptedRegex.test(event.message)) {
            this.registered = true;
            logger.info(`Successfully connected and identified to IRC server ${this.name}`);
          } else {
            logger.warn(`Unexpected NickServ notice on ${this.name}: ${event.message}`);
          }
        }
      };

      this.bot.on('notice', nicservNoticeHandler);
      this.bot.say('NickServ', `IDENTIFY ${this.nickservPassword}`);

      // Cleanup notice handler after timeout
      setTimeout(() => this.bot.removeListener('notice', nicservNoticeHandler), 5000);
    } else {
      this.registered = true;
      logger.info(`Successfully connected to IRC server ${this.name}`);
      if (!this.connectOptions.rejectUnauthorized && this.connectOptions.ssl) {
        logger.warn(`Connection was established on secure channel without TLS peer verification`);
      }
    }

    await this.waitUntilRegistered();

    // Reconnect to previously joined channels
    for (const channel of this.previouslyJoinedChannels) {
      try {
        await this.joinRoom(channel);
      } catch {
        logger.error(`Unable to rejoin IRC channel ${channel} on ${this.name} after reconnect`);
      }
    }
  }

  private checkIfRegistered() {
    if (!this.registered || this.shuttingDown) throw new Error(`IRC network ${this.name} is not connected`);
  }

  public async waitUntilRegistered() {
    while (!this.registered) await Utils.sleep(100);
  }

  private async connect() {
    while (!this.shuttingDown) {
      if (!this.registered) {
        this.bot.quit();
        logger.info(`Attempting to connect to IRC at ${this.connectOptions.host}:${this.connectOptions.ssl ? '+' : ''}${this.connectOptions.port}`);
        this.bot.connect(this.connectOptions);
      }
      await Utils.sleep(10000);
    }
  }

  // Join a room with normal JOIN and detect/throw for failure
  public async joinRoom(channel: string) {
    this.checkIfRegistered();

    const lowercaseChannel = channel.toLowerCase();
    if (this.joinedChannels.includes(lowercaseChannel)) return;

    return new Promise<void>((resolve, reject) => {
      // If joining takes longer than 5 seconds, consider it a failure
      const timeout = setTimeout(() => reject(new Error(`Unable to join IRC channel ${channel} on ${this.name}`)), 5000);

      const channelUserListHandler = (event: any) => {
        if (event.channel.toLowerCase() === lowercaseChannel) {
          clearTimeout(timeout);
          this.joinedChannels.push(lowercaseChannel);
          this.previouslyJoinedChannels.add(lowercaseChannel);
          logger.info(`Joined ${channel} on ${this.name}`);
          resolve();
        }
      };

      this.bot.on('userlist', channelUserListHandler);
      this.bot.join(channel);

      // Cleanup userlist handler
      setTimeout(() => this.bot.removeListener('userlist', channelUserListHandler), 5001);
    });
  }

  public message(target: string, message: string) {
    this.checkIfRegistered();
    message.split('\n').forEach((msg) => this.bot.say(target, msg));
  }

  public async addChannelWatcher(channel: string, callback: (event: MessageEvent) => any) {
    const channelLower = channel.toLowerCase();
    await this.joinRoom(channelLower);

    const onMessage = (event: MessageEvent) => {
      if (event.target.toLowerCase() === channelLower) {
        event.message = colors.stripColorsAndStyle(event.message);
        callback(event);
      }
    };

    this.bot.on('privmsg', onMessage);
    return () => this.bot.removeListener('privmsg', onMessage);
  }

  public disconnect() {
    this.shuttingDown = true;
    this.bot.quit();
    this.registered = false;
  }
}
