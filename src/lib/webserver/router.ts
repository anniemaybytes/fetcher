import express from 'express';

import { LevelDB } from '../clients/leveldb.js';
import { Episode } from '../models/episode.js';
import { WebServerUtility } from './utility.js';
import { WebServerMiddleware } from './middleware.js';

export class WebServerRouter {
  public static register(app: express.Application) {
    WebServerRouter.registerApi(app);
    WebServerRouter.registerViews(app);
  }

  static registerApi(app: express.Application) {
    const router = express.Router();

    router.delete('/episode/:formattedShowName', async (req, res) => {
      const title = req.params.formattedShowName;
      if (!title) return res.status(400).json({ error: 'Must provide episode formatted name to delete' });
      try {
        const state = await LevelDB.get(`file::${title}`);
        // Use currently fetching episode if it exists, otherwise create new episode model from state
        let episode = Episode.fetchingEpisodesCache[state.saveFileName];
        if (!episode || episode.formattedName() !== title) episode = Episode.fromStorageJSON(state);
        // Abort fetching episode (if necessary) and delete it from state
        await episode.abortAndDelete();
        return res.status(200).json({ success: `Deleted ${title}` });
      } catch (e) {
        if (e.code === 'LEVEL_NOT_FOUND') return res.status(404).json({ error: 'Requested item was not found' });
        return res.status(500).json({ error: 'Internal Server Error', exception: e });
      }
    });

    app.use(router);
  }

  static registerViews(app: express.Application) {
    app.set('view engine', 'pug');
    app.set('views', 'dist/views/');

    const router = express.Router();
    router.use(WebServerMiddleware.generateBreadcrumbsMiddleware);
    router.use(WebServerMiddleware.loadWebpackManifest);

    router.get('/', async (req, res) => {
      const episodes = await WebServerUtility.getEpisodeData();
      const grouped = episodes.reduce((r, v, i, a, k = v.state) => ((r[k] || (r[k] = [])).push(v), r), {});
      delete grouped.complete;
      res.render('index', { input: grouped });
    });

    router.get('/shows', async (req, res) => {
      const episodes = await WebServerUtility.getEpisodeData();
      const shows: { [showName: string]: { latestEpisode: number; lastModified: string } } = {};
      episodes.forEach((episode) => {
        const currentShow = shows[episode.showName];
        if (!currentShow) {
          shows[episode.showName] = {
            latestEpisode: episode.episode,
            lastModified: episode.modified,
          };
        } else {
          if (currentShow.latestEpisode < episode.episode) currentShow.latestEpisode = episode.episode;
          if (new Date(currentShow.lastModified).getTime() < new Date(episode.modified).getTime()) {
            currentShow.lastModified = episode.modified;
          }
        }
      });
      res.render('shows', { input: shows });
    });

    router.get('/shows/:title', async (req, res) => {
      const title = req.params.title;
      let episodes = await WebServerUtility.getEpisodeData();
      episodes = episodes.filter((episode) => episode.showName === title).sort((a, b) => a.formatted.localeCompare(b.formatted));
      res.render('show', { input: episodes });
    });

    app.use(router);
  }
}
