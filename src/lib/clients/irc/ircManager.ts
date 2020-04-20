import { IRCNetwork } from './ircNetwork';
import { handleControlMessage } from './ircControl';
import { Config } from '../config';
import { sleep, timeoutPromise } from '../../utils';
import { getLogger } from '../../logger';
import { MessageEvent } from '../../../types';
const logger = getLogger('IRCManagerClient');

const ircRegistrationTimeout = 1000 * 30; // 30 seconds

export class IRCManager {
  public static networks: { [key: string]: IRCNetwork } = {};
  public static controlNetwork?: IRCNetwork;
  public static controlChannel: string;

  public static async initialize() {
    // Connect to all of the networks in the config
    await Promise.all(
      Object.entries(Config.getConfig().irc_networks || {}).map(async ([key, options]) => {
        const network = new IRCNetwork(key, options);
        try {
          // if failed to connect/register within timeout period, ignore this network
          await timeoutPromise(network.waitUntilRegistered(), ircRegistrationTimeout, new Error('IRC connect/register timed out'));
          IRCManager.networks[key] = network;
        } catch (e) {
          logger.error(`Failed to join IRC network ${key}:`, e);
          network.disconnect();
        }
      })
    );
    // Configure the control network settings
    const controlNetworkSettings = Config.getConfig().irc_control;
    IRCManager.controlNetwork = IRCManager.networks[controlNetworkSettings.network];
    IRCManager.controlChannel = controlNetworkSettings.channel;
    if (!IRCManager.controlNetwork)
      return logger.error(
        `IRC control network ${controlNetworkSettings.network} either didn't connect or doesn't exist in config; will not use control network`
      );
    try {
      await IRCManager.addChannelWatcher(controlNetworkSettings.network, IRCManager.controlChannel, handleControlMessage);
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
    if (!IRCManager.controlNetwork) return logger.warn('Tried to send message to unconnected IRC control network');
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
