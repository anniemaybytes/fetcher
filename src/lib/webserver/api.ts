import express from 'express';
import { LevelDB } from '../clients/leveldb';
import { Episode } from '../models/episode';

export function routeAPI(app: express.Application) {
  const apiRouter = express.Router();

  apiRouter.delete('/episode/:formattedShowName', async (req, res) => {
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
      if (e.type === 'NotFoundError') return res.status(404).json({ error: 'Requested item was not found' });
      return res.status(500).json({ error: 'Internal Server Error', exception: e });
    }
  });

  app.use(apiRouter);
}
