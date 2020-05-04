import express from 'express';
import { Config } from '../clients/config';
import { routeViews } from './views';
import { routeAPI } from './api';
import { getLogger } from '../logger';
const logger = getLogger('Webserver');

let server: any = undefined;

export async function startWebserver() {
  const app = express();
  const port = Config.getConfig().http_port || 3004;
  const bind = Config.getConfig().http_bind || '::';
  app.locals.basePath = Config.getConfig().http_path || '';

  app.use(express.static('dist/static/'));
  routeViews(app);
  routeAPI(app);

  server = app.listen(port, bind);
  logger.info(`Webserver now listening on ${bind} over port ${port}`);
}

export async function stopWebserver() {
  if (server) server.close();
}
