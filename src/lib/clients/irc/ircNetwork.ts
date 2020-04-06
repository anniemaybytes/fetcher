import * as irc from 'irc-framework';
import { stripColorsAndStyle } from 'irc-colors';
import { sleep } from '../../utils';
import { getLogger } from '../../logger';
import { IRCNetworkConfig, MessageEvent } from '../../../types';
const logger = getLogger('IRCNetworkClient');

const nickServPasswordAcceptedRegex = /Password accepted/i;

export class IRCNetwork {
  name: string;
  bot: any;
  connectOptions: any;
  nickservPassword?: string;
  registered = false;
  shuttingDown = false;
  joinedChannels: string[];

  constructor(name: string, options: IRCNetworkConfig) {
    this.joinedChannels = [];
    this.name = name;
    this.nickservPassword = options.nickserv_password;
    // Reconnection handled manually otherwise messages can be dropped when not connected
    this.bot = new irc.Client({ auto_reconnect: false });
    const targetNick = options.nick.replace(/\$/g, Math.random().toString(36).substr(7, 3));
    this.connectOptions = {
      host: options.host,
      port: options.port || 6667,
      nick: targetNick,
      username: targetNick,
      gecos: targetNick,
      ssl: options.ssl === undefined ? false : options.ssl,
      rejectUnauthorized: options.verify_certificate === undefined ? true : options.verify_certificate,
    };
    this.bot.on('nick in use', () =>
      logger.error(`Attempted IRC nickname ${this.connectOptions.nick} is currently in use on ${this.name}; will retry`)
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
    if (this.nickservPassword) {
      const nicservNoticeHandler = (event: any) => {
        if (event.nick.toLowerCase() === 'nickserv') {
          if (nickServPasswordAcceptedRegex.test(event.message)) {
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
    // Reconnect to previously joined channels
    const previousChannels = this.joinedChannels;
    this.joinedChannels = [];
    for (const channel of previousChannels) {
      try {
        await this.joinRoom(channel);
      } catch (e) {
        logger.error(`Unable to rejoin IRC channel ${channel} on ${this.name} after reconnect`);
      }
    }
  }

  private checkIfRegistered() {
    if (!this.registered || this.shuttingDown) throw new Error(`IRC network ${this.name} is not connected`);
  }

  public async waitUntilRegistered() {
    while (!this.registered) await sleep(100);
  }

  private async connect() {
    while (!this.shuttingDown) {
      if (!this.registered) {
        this.bot.quit();
        logger.info(`Attempting to connect to IRC at ${this.connectOptions.host}:${this.connectOptions.ssl ? '+' : ''}${this.connectOptions.port}`);
        this.bot.connect(this.connectOptions);
      }
      await sleep(10000);
    }
  }

  // Join a room with normal JOIN and detect/throw for failure
  public async joinRoom(channel: string) {
    this.checkIfRegistered();
    if (this.joinedChannels.includes(channel.toLowerCase())) return;
    return new Promise<void>((resolve, reject) => {
      // If joining takes longer than 5 seconds, consider it a failure
      const timeout = setTimeout(() => reject(new Error(`Unable to join IRC channel ${channel} on ${this.name}`)), 5000);
      const channelUserListHandler = (event: any) => {
        if (event.channel.toLowerCase() === channel.toLowerCase()) {
          clearTimeout(timeout);
          this.joinedChannels.push(channel.toLowerCase());
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
        event.message = stripColorsAndStyle(event.message);
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
