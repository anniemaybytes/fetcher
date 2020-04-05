import { IRCNetwork } from './ircNetwork';
import { Config } from '../config';
import { sleep } from '../../utils';
import { getLogger } from '../../logger';
import { MessageEvent } from '../../../types';
const logger = getLogger('IRCManagerClient');

export class IRCManager {
  public static networks: { [key: string]: IRCNetwork } = {};
  public static controlNetwork: IRCNetwork;
  public static controlChannel: string;

  public static async initialize() {
    // Connect to all of the networks in the config
    await Promise.all(
      Object.entries(Config.getConfig().irc_networks || {}).map(async ([key, options]) => {
        const network = new IRCNetwork(key, options);
        await network.waitUntilRegistered();
        IRCManager.networks[key] = network;
      })
    );
    // Configure the control network settings
    const controlNetworkSettings = Config.getConfig().irc_control;
    if (!IRCManager.networks[controlNetworkSettings.network]) throw new Error(`Control network ${controlNetworkSettings.network} doesn't exist`);
    IRCManager.controlNetwork = IRCManager.networks[controlNetworkSettings.network];
    IRCManager.controlChannel = controlNetworkSettings.channel;
    try {
      await IRCManager.controlNetwork.joinRoom(IRCManager.controlChannel);
    } catch (e) {
      logger.error(`Unable to join control channel ${IRCManager.controlChannel} on ${IRCManager.controlNetwork.name}`);
    }
  }

  public static hasNetwork(networkKey: string) {
    return Boolean(IRCManager.networks[networkKey]);
  }

  // Returns a function which removes the listener (for cleanup) when called
  public static async addChannelWatcher(network: string, channel: string, callback: (event: MessageEvent) => any) {
    const ircNetwork = IRCManager.networks[network];
    if (!ircNetwork) throw new Error(`Request IRC network ${network} doesn't exist`);
    return ircNetwork.addChannelWatcher(channel, callback);
  }

  public static controlAnnounce(message: string) {
    try {
      IRCManager.controlNetwork.message(IRCManager.controlChannel, message);
    } catch (e) {
      logger.error(`Error announcing message to control channel: ${e}`);
    }
  }

  public static async shutdown() {
    Object.values(IRCManager.networks).forEach((network) => network.disconnect());
    await sleep(1000); // Wait for irc cleanup
  }
}
