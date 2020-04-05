import { Show } from './show';
import { Source } from './sources/source';
import { Releasers, ReleaserDef } from '../../types';

export class Group {
  // Used for global storage of groups
  public static groups: { [groupKey: string]: Group } = {};

  name: string;
  key: string;
  shows: Show[];

  constructor(key: string, options: ReleaserDef) {
    this.key = key;
    this.name = options.name;
    this.shows = []; // to be added externally, when loading shows
    // Create group's sources
    options.sources.forEach((source) => {
      Object.entries(source).forEach(([type, options]) => {
        const [sourceType, fetchType] = type.split('+');
        if (!sourceType || !fetchType) throw new Error(`Missing source or fetch type ${sourceType} ${fetchType}`);
        Source.createSource(sourceType, this, fetchType, options);
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
