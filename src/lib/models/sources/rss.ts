import path from 'path';
import url from 'url';
import rss from 'rss-parser';

import { Source } from './source.js';
import { Group } from '../group.js';
import { Parser } from '../../parser.js';
import { ReleaserRSSOptions } from '../../../types.js';

import { Logger } from '../../logger.js';
const logger = Logger.get('RSSSource');

export class RSSSource extends Source {
  public readonly url: string;

  // for testing purposes
  public static parser = rss;

  constructor(group: Group, fetchType: string, options: ReleaserRSSOptions) {
    super('rss', fetchType, options.meta || {}, group);

    this.url = options.url;
  }

  public async fetch() {
    try {
      const parser = new RSSSource.parser({ headers: { 'User-Agent': 'fetcher/2.0 (rss-parser [RSSSource])' } });
      const feed = await parser.parseURL(this.url);

      feed.items?.forEach((item) => {
        let link = '';
        let title = '';
        if (!item.enclosure) {
          if (!item.title || !item.link) return;
          link = item.link;
          title = item.title;
        } else {
          link = item.enclosure.url;
          const linkpath = new url.URL(item.enclosure.url).pathname;
          if (!linkpath) return;
          title = unescape(path.basename(linkpath));
        }
        const episode = Parser.parseWantedEpisode(title, this.getFetcherOptions(link), this);
        // Start episode fetch. This is an async call that will run in the background
        if (episode) episode.fetchEpisode();
      });
    } catch (e) {
      logger.error(`Error fetching/parsing RSS ${this.url} for ${this.group.name}`, e);
    }
  }

  public close() {}
}

Source.registerSourceType('rss', RSSSource);
