import { NextFunction, Request, Response } from 'express';
import { promises } from 'fs';

export class WebServerMiddleware {
  public static generateBreadcrumbsMiddleware(req: Request, res: Response, next: NextFunction) {
    const base = `${res.app.locals.basePath}/`;
    const breadcrumbs = [{ title: 'index', uri: base }];
    req.path
      .split('/')
      .filter(Boolean)
      .forEach((seg, index, arr) => breadcrumbs.push({ title: decodeURI(seg), uri: `${base}${arr.slice(0, index + 1).join('/')}` }));
    res.locals.breadcrumbs = breadcrumbs;
    next();
  }

  public static async loadWebpackManifest(req: Request, res: Response, next: NextFunction) {
    res.locals.assets = JSON.parse(await promises.readFile('dist/static/manifest.json', 'utf8'));
    next();
  }
}
