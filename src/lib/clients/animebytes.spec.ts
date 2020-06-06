import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { Episode } from '../models/episode';
import { Config } from './config';
import { AnimeBytes } from './animebytes';

describe('animebytes', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
    AnimeBytes.username = 'testuser';
    AnimeBytes.password = 'testpassword';
    AnimeBytes.shows_uri = 'testshowsuri';
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('initialize', () => {
    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({ tracker_user: 'user', tracker_pass: 'pass', shows_uri: 'uri' } as any);
    });

    it('loads static variables from config', async () => {
      await AnimeBytes.initialize();
      expect(AnimeBytes.username).to.equal('user');
      expect(AnimeBytes.password).to.equal('pass');
      expect(AnimeBytes.shows_uri).to.equal('uri');
    });
  });

  describe('ensureLoggedIn', () => {
    let fetchStub: SinonStub;

    beforeEach(() => {
      fetchStub = sandbox.stub(AnimeBytes, 'got').resolves({ statusCode: 200, body: 'hi' });
    });

    it('throws an error when it doesnt receieve a redirect for login page', async () => {
      try {
        await AnimeBytes.ensureLoggedIn();
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('throws an error when upload page does not provide an http 200 response', async () => {
      fetchStub.resolves({ statusCode: 303 });
      try {
        await AnimeBytes.ensureLoggedIn();
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });
  });

  describe('upload', () => {
    let loggedInStub: SinonStub;
    let fetchStub: SinonStub;
    let fakeEpisode: Episode;
    const fakeMediaInfo: any = { audio: 'audio', audiochannels: 'channels', codec: 'codec', text: 'text' };

    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({ torrent_dir: 'tdir' } as any);
      loggedInStub = sandbox.stub(AnimeBytes, 'ensureLoggedIn');
      fetchStub = sandbox.stub(AnimeBytes, 'got').resolves({ statusCode: 200, body: 'hi' });
      fakeEpisode = Episode.fromStorageJSON({
        episode: 1,
        resolution: 'resolution',
        container: 'container',
        saveFileName: 'savefilename',
        groupID: 'groupid',
        media: 'media',
        subbing: 'subbing',
        groupName: 'groupname',
      });
    });

    it('calls ensureLoggedIn', async () => {
      await AnimeBytes.upload(fakeEpisode, fakeMediaInfo);
      assert.calledOnce(loggedInStub);
    });

    it('throws error if no groupID', async () => {
      fakeEpisode.groupID = undefined as any;
      try {
        await AnimeBytes.upload(fakeEpisode, fakeMediaInfo);
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('calls fetch with proper URL', async () => {
      await AnimeBytes.upload(fakeEpisode, fakeMediaInfo);
      assert.calledOnce(fetchStub);
      const args = fetchStub.getCall(0).args;
      expect(args[0]).to.equal('https://animebytes.tv/upload.php?type=anime&groupid=groupid');
      expect(args[1].method).to.equal('POST');
      // I don't think there's a way to pull params off of FormData for some reason, so I can't exlicitly check request body here
    });

    it('returns if receieved a 409 (conflict)', async () => {
      fetchStub.resolves({ statusCode: 409, body: 'hi' });
      await AnimeBytes.upload(fakeEpisode, fakeMediaInfo);
    });

    it('returns if torrent already exists', async () => {
      fetchStub.resolves({ statusCode: 200, body: 'torrent file already exists' });
      await AnimeBytes.upload(fakeEpisode, fakeMediaInfo);
    });

    it('throws an error for non-200 response', async () => {
      fetchStub.resolves({ statusCode: 400, body: 'hi' });
      try {
        await AnimeBytes.upload(fakeEpisode, fakeMediaInfo);
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('throws an error if `the following error` found in response body', async () => {
      fetchStub.resolves({ statusCode: 200, body: 'the following error' });
      try {
        await AnimeBytes.upload(fakeEpisode, fakeMediaInfo);
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });
  });

  describe('getShows', () => {
    let loggedInStub: SinonStub;
    let fetchStub: SinonStub;

    beforeEach(() => {
      loggedInStub = sandbox.stub(AnimeBytes, 'ensureLoggedIn');
      fetchStub = sandbox.stub(AnimeBytes, 'got').resolves({ statusCode: 200, body: Buffer.from('hi') });
    });

    it('calls ensureLoggedIn', async () => {
      await AnimeBytes.getShows();
      assert.calledOnce(loggedInStub);
    });

    it('returns the raw buffer from the fetch body', async () => {
      expect(Buffer.from('hi').equals(await AnimeBytes.getShows())).to.be.true;
    });

    it('throws an error on bad fetch status', async () => {
      fetchStub.resolves({ statusCode: 400 });
      try {
        await AnimeBytes.getShows();
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });
  });
});
