import express from 'express';
import http from 'http';

import { Config } from '../clients/config.js';
import { WebServerRouter } from './router.js';

import { Logger } from '../logger.js';
const logger = Logger.get('WebServer');

export class WebServer {
  private static server: http.Server | undefined = undefined;

  public static async start(imp: any /* for testing */ = express) {
    const app = imp();

    const bind = Config.getConfig().http?.bind || '::';
    const port = Config.getConfig().http?.port || 3004;
    app.locals.basePath = Config.getConfig().http?.path || '';

    app.use('/static', express.static('dist/static'));
    WebServerRouter.register(app);

    WebServer.server = app.listen(port, bind);
    logger.info(`Webserver now listening on ${bind} over port ${port}`);
  }

  public static async shutDown() {
    if (WebServer.server) WebServer.server.close();
  }
}
