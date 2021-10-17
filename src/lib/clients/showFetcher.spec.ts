import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { Config } from './config';
import { AnimeBytes } from './animebytes';
import { ShowsReleasersFetcher } from './showFetcher';
import { promises as fs } from 'fs';
import mock from 'mock-fs';

describe('ShowFetcher', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    mock({});
    sandbox = createSandbox();
  });

  afterEach(() => {
    mock.restore();
    sandbox.restore();
  });

  describe('reload', () => {
    let getShowsMock: SinonStub;

    beforeEach(() => {
      ShowsReleasersFetcher.lastHash = '';
      ShowsReleasersFetcher.releasersJSON = undefined as any;
      ShowsReleasersFetcher.showsJSON = undefined as any;
      sandbox.stub(Config, 'getConfig').returns({} as any);
      getShowsMock = sandbox.stub(AnimeBytes, 'getShows').resolves(Buffer.from('{}'));
    });

    it('Calls getShows from AnimeBytes', async () => {
      await ShowsReleasersFetcher.reload();
      assert.calledOnce(getShowsMock);
    });

    it('Saves showsJSON and releasersJSON', async () => {
      getShowsMock.resolves(Buffer.from('{"shows":"someData","releasers":"moreData"}'));
      await ShowsReleasersFetcher.reload();
      expect(ShowsReleasersFetcher.showsJSON).to.equal('someData');
      expect(ShowsReleasersFetcher.releasersJSON).to.equal('moreData');
    });

    it('Returns true if shows json has changed', async () => {
      expect(await ShowsReleasersFetcher.reload()).to.be.true;
    });

    it('Writes to disk if shows json has changed', async () => {
      await ShowsReleasersFetcher.reload();
      expect(await fs.readFile('shows.json', 'utf8')).to.equal((await getShowsMock()).toString());
    });

    it('Returns false and does not write to disk if previous hash matches', async () => {
      ShowsReleasersFetcher.lastHash = 'RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=';
      expect(await ShowsReleasersFetcher.reload()).to.be.false;
    });

    it('Uses file cache if getting from AnimeBytes fails', async () => {
      getShowsMock.throws(new Error());
      mock({ 'shows.json': '{"shows":"fileData","releasers":"moreFileData"}' });
      await ShowsReleasersFetcher.reload();
      expect(ShowsReleasersFetcher.showsJSON).to.equal('fileData');
      expect(ShowsReleasersFetcher.releasersJSON).to.equal('moreFileData');
    });
  });
});
