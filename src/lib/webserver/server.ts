import express, { Request, Response, NextFunction } from 'express';
import { Config } from '../clients/config';
import { LevelDB } from '../clients/leveldb';
import { Episode } from '../models/episode';
import { getLogger } from '../logger';
const logger = getLogger('Webserver');

let server: any = undefined;

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
    if (Episode.fetchingEpisodesCache[data.saveFileName]) {
      data.progress = Episode.fetchingEpisodesCache[data.saveFileName].getProgressString();
    } else {
      data.progress = data.state;
    }
  });
  return rawData;
}

export async function startWebserver() {
  const app = express();
  const port = Config.getConfig().http_port || 3004;
  const bind = Config.getConfig().http_bind || '::';
  app.locals.basePath = Config.getConfig().http_path || '';

  app.set('view engine', 'pug');
  app.set('views', 'dist/views/');
  app.use(express.static('dist/static/'));

  app.use(generateBreadcrumbsMiddleware);

  app.get('/', async (req, res) => {
    const episodes = await getEpisodeData();
    const grouped = episodes.reduce((r, v, i, a, k = v.state) => ((r[k] || (r[k] = [])).push(v), r), {});
    delete grouped.complete;
    res.render('index', { input: grouped });
  });

  app.get('/shows', async (req, res) => {
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

  app.get('/shows/:title', async (req, res) => {
    const title = req.params.title;
    let episodes = await getEpisodeData();
    episodes = episodes.filter((episode) => episode.showName === title).sort((a, b) => a.saveFileName.localeCompare(b.saveFileName));
    res.render('show', { input: episodes });
  });

  server = app.listen(port, bind);
  logger.info(`Webserver now listening on ${bind} over port ${port}`);
}

export async function stopWebserver() {
  if (server) server.close();
}
