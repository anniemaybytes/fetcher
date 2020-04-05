import { Group } from './group';
import { Shows, ShowDef } from '../../types';

export class Show {
  name: string;
  groupID: string;
  wantedResolutions: string[];
  releasers: {
    [releaser: string]: {
      regex: RegExp;
      media: string;
      subbing: string;
    };
  };

  constructor(name: string, definition: ShowDef) {
    this.name = name;
    this.groupID = definition.form.groupid;
    this.wantedResolutions = definition.formats;
    this.releasers = {};
    Object.entries(definition.releasers).forEach(([groupKey, def]) => {
      this.releasers[groupKey] = {
        regex: new RegExp(def.regex, 'i'),
        media: def.media,
        subbing: def.subbing,
      };
    });
  }

  public static loadShows(showsJSON: Shows) {
    Object.entries(showsJSON).map(([name, options]) => {
      // Create the show
      const show = new Show(name, options);
      // Add the reference to the relevant groups
      Object.keys(show.releasers).forEach((groupKey) => {
        if (!Group.groups[groupKey]) throw new Error(`Releaser ${groupKey} does not exist from show ${show.name}; bad shows.json`);
        Group.groups[groupKey].shows.push(show);
      });
    });
  }
}
