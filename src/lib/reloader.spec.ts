import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';

import { Source } from './models/sources/source.js';
import { Show } from './models/show.js';
import { Group } from './models/group.js';
import { ShowsReleasersFetcher } from './clients/fetcher.js';
import { Reloader } from './reloader.js';

describe('Reloader', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('reloadShowsAndGroups', () => {
    let removeSourcesStub: SinonStub;
    let loadGroupsStub: SinonStub;
    let loadShowsStub: SinonStub;
    let showsReleaserReload: SinonStub;

    beforeEach(() => {
      showsReleaserReload = sandbox.stub(ShowsReleasersFetcher, 'reload');
      removeSourcesStub = sandbox.stub(Source, 'removeAllSources');
      loadGroupsStub = sandbox.stub(Group, 'loadGroups');
      loadShowsStub = sandbox.stub(Show, 'loadShows');
    });

    it('Reloads shows.json from ShowsReleasersFetcher', async () => {
      await Reloader.reloadShowsAndGroups();
      assert.calledOnce(showsReleaserReload);
    });

    it('Removes all old sources then reloads groups and shows with data from ShowsReleasersFetcher if reload has new data', async () => {
      showsReleaserReload.resolves(true);
      await Reloader.reloadShowsAndGroups();
      assert.calledOnce(removeSourcesStub);
      assert.calledOnceWithExactly(loadGroupsStub, ShowsReleasersFetcher.releasersJSON);
      assert.calledOnceWithExactly(loadShowsStub, ShowsReleasersFetcher.showsJSON);
    });

    it('Does not do anything if reload has no new data', async () => {
      showsReleaserReload.resolves(false);
      await Reloader.reloadShowsAndGroups();
      assert.notCalled(loadGroupsStub);
      assert.notCalled(loadShowsStub);
    });

    it('Does not throw on unexpected error', async () => {
      showsReleaserReload.throws(new Error('error'));
      await Reloader.reloadShowsAndGroups();
    });
  });

  describe('refreshSources', () => {
    let fakeSource: any;

    beforeEach(() => {
      fakeSource = { fetch: sandbox.stub() };
      Source.activeSources = [fakeSource];
    });

    it('Calls fetch on each currently active source', async () => {
      await Reloader.refreshSources();
      assert.calledOnce(fakeSource.fetch);
    });

    it('Does not throw on individual fetch error', async () => {
      fakeSource.fetch.throws(new Error('broken'));
      await Reloader.refreshSources();
    });

    it('Does not throw on bad active sources', async () => {
      Source.activeSources = false as any;
      await Reloader.refreshSources();
    });
  });

  describe('startRefreshAndReloads', () => {
    let fakeReload: SinonStub;
    let fakeRefresh: SinonStub;

    beforeEach(() => {
      fakeReload = sandbox.stub(Reloader, 'reloadShowsAndGroups');
      fakeRefresh = sandbox.stub(Reloader, 'refreshSources');
    });

    it('Reloads shows and refreshes sources', async () => {
      await Reloader.start();
      assert.calledOnce(fakeReload);
      assert.calledOnce(fakeRefresh);
    });
  });
});
