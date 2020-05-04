import express, { Request, Response, NextFunction } from 'express';
import { LevelDB } from '../clients/leveldb';
import { Episode } from '../models/episode';

function generateBreadcrumbsMiddleware(req: Request, res: Response, next: NextFunction) {
  const base = `${res.app.locals.basePath}/`;
  const breadcrumbs = [{ title: 'index', uri: base }];
  req.path
    .split('/')
    .filter(Boolean)
    .forEach((seg, index, arr) => breadcrumbs.push({ title: decodeURI(seg), uri: `${base}${arr.slice(0, index + 1).join('/')}` }));
  res.locals.breadcrumbs = breadcrumbs;
  next();
}

async function getEpisodeData() {
  const rawData = await LevelDB.list();
  rawData.forEach((data) => {
    data.formatted = Episode.episodeFormattedName(
      data.showName,
      data.episode,
      data.version,
      data.resolution,
      data.groupName,
      data.container,
      data.crc
    );
    if (Episode.fetchingEpisodesCache[data.saveFileName] && Episode.fetchingEpisodesCache[data.saveFileName].formattedName() === data.formatted) {
      data.progress = Episode.fetchingEpisodesCache[data.saveFileName].getProgressString();
    } else {
      data.progress = data.state;
    }
  });
  return rawData;
}

export function routeViews(app: express.Application) {
  app.set('view engine', 'pug');
  app.set('views', 'dist/views/');

  const viewRouter = express.Router();

  viewRouter.use(generateBreadcrumbsMiddleware);

  viewRouter.get('/', async (req, res) => {
    const episodes = await getEpisodeData();
    const grouped = episodes.reduce((r, v, i, a, k = v.state) => ((r[k] || (r[k] = [])).push(v), r), {});
    delete grouped.complete;
    res.render('index', { input: grouped });
  });

  viewRouter.get('/shows', async (req, res) => {
    const episodes = await getEpisodeData();
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

  viewRouter.get('/shows/:title', async (req, res) => {
    const title = req.params.title;
    let episodes = await getEpisodeData();
    episodes = episodes.filter((episode) => episode.showName === title).sort((a, b) => a.formatted.localeCompare(b.formatted));
    res.render('show', { input: episodes });
  });

  app.use(viewRouter);
}
