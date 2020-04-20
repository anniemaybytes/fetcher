import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { Source } from './models/sources/source';
import { Show } from './models/show';
import { Group } from './models/group';
import { ShowsReleasersFetcher } from './clients/showfetcher';
import { Reloader } from './reloader';

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

    it('reloads shows.json from ShowsReleasersFetcher', async () => {
      await Reloader.reloadShowsAndGroups();
      assert.calledOnce(showsReleaserReload);
    });

    it('removes all old sources then reloads groups and shows with data from ShowsReleasersFetcher if reload has new data', async () => {
      showsReleaserReload.resolves(true);
      await Reloader.reloadShowsAndGroups();
      assert.calledOnce(removeSourcesStub);
      assert.calledOnceWithExactly(loadGroupsStub, ShowsReleasersFetcher.releasersJSON);
      assert.calledOnceWithExactly(loadShowsStub, ShowsReleasersFetcher.showsJSON);
    });

    it('does not do anything if reload has no new data', async () => {
      showsReleaserReload.resolves(false);
      await Reloader.reloadShowsAndGroups();
      assert.notCalled(loadGroupsStub);
      assert.notCalled(loadShowsStub);
    });

    it('does not throw on unexpected error', async () => {
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

    it('calls fetch on each currently active source', async () => {
      await Reloader.refreshSources();
      assert.calledOnce(fakeSource.fetch);
    });

    it('does not throw on individual fetch error', async () => {
      fakeSource.fetch.throws(new Error('broken'));
      await Reloader.refreshSources();
    });

    it('does not throw on bad active sources', async () => {
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

    it('reloads shows and refreshes sources', async () => {
      await Reloader.startRefreshAndReloads();
      assert.calledOnce(fakeReload);
      assert.calledOnce(fakeRefresh);
    });
  });
});
