import { Reloader } from '../../reloader';
import { MessageEvent } from '../../../types';
import { getLogger } from '../../logger';
const logger = getLogger('IRCControl');

const reloadRegex = /^!reload$/i;
const fetchRegex = /^!fetch$/i;

export function handleControlMessage(event: MessageEvent) {
  if (reloadRegex.test(event.message)) {
    logger.debug(`shows.json reload triggered in IRC by ${event.nick}`);
    Reloader.reloadShowsAndGroups();
    event.reply('Reloading shows.json now');
  } else if (fetchRegex.test(event.message)) {
    logger.debug(`sources refresh triggered in IRC by ${event.nick}`);
    Reloader.refreshSources();
    event.reply('Refreshing sources now');
  }
}
