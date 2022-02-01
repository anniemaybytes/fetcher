import { Reloader } from '../../reloader.js';
import { MessageEvent } from '../../../types.js';

import { Logger } from '../../logger.js';
const logger = Logger.get('IRCControl');

export class IRCControl {
  private static reloadRegex = /^!reload$/i;
  private static fetchRegex = /^!fetch$/i;

  public static handle(event: MessageEvent) {
    if (IRCControl.reloadRegex.test(event.message)) {
      logger.debug(`Shows definition reload triggered in IRC by ${event.nick}`);
      Reloader.reloadShowsAndGroups();
      event.reply('Reloading shows.json now');
    } else if (IRCControl.fetchRegex.test(event.message)) {
      logger.debug(`Sources refresh triggered in IRC by ${event.nick}`);
      Reloader.refreshSources();
      event.reply('Refreshing sources now');
    }
  }
}
