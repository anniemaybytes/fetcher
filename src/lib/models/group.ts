import { Show } from './show.js';
import { Source } from './sources/source.js';
import { Releasers, ReleaserDef } from '../../types.js';

import { Logger } from '../logger.js';
const logger = Logger.get('GroupModel');

export class Group {
  // Used for global storage of groups
  public static groups: { [groupKey: string]: Group } = {};

  public name: string;
  public key: string;
  public shows: Show[];

  constructor(key: string, options: ReleaserDef) {
    this.key = key;
    this.name = options.name;
    this.shows = []; // to be added externally, when loading shows
    // Create group's sources
    options.sources.forEach((source) => {
      Object.entries(source).forEach(([type, options]) => {
        const [sourceType, fetchType] = type.split('+');
        if (!sourceType || !fetchType) throw new Error(`Missing source or fetch type ${sourceType} ${fetchType}`);
        try {
          Source.createSource(sourceType, this, fetchType, options);
        } catch (e) {
          logger.error(`Error creating ${sourceType.toUpperCase()} source for ${this.name} group:`, e);
        }
      });
    });
  }

  public findShow(filename: string) {
    for (const possibleShow of this.shows) {
      if (possibleShow.releasers[this.key]?.regex.test(filename)) {
        return possibleShow;
      }
    }
    return undefined;
  }

  public static loadGroups(groupJSON: Releasers) {
    Group.groups = {}; // Delete old groups
    Object.entries(groupJSON).forEach(([key, options]) => {
      Group.groups[key] = new Group(key, options);
    });
  }
}
