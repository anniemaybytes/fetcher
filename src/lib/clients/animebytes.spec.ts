import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';

import { Episode } from '../models/episode.js';
import { Config } from './config.js';
import { ABClient } from './animebytes.js';

describe('AnimeBytes', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
    ABClient.username = 'testuser';
    ABClient.password = 'testpassword';
    ABClient.base_uri = 'http://example.com';
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('initialize', () => {
    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({ animebytes: { username: 'user', password: 'pass', base_uri: 'uri' } } as any);
    });

    it('Loads static variables from config', async () => {
      await ABClient.initialize();
      expect(ABClient.username).to.equal('user');
      expect(ABClient.password).to.equal('pass');
      expect(ABClient.base_uri).to.equal('uri');
    });
  });

  describe('ensureLoggedIn', () => {
    let fetchStub: SinonStub;

    beforeEach(() => {
      fetchStub = sandbox.stub(ABClient, 'got').resolves({ statusCode: 200, body: 'hi' });
    });

    it('Throws an error when it doesnt receieve a redirect for login page', async () => {
      try {
        await ABClient.ensureLoggedIn();
      } catch {
        return;
      }
      expect.fail('Did not throw');
    });

    it('Throws an error when upload page does not provide an http 200 response', async () => {
      fetchStub.resolves({ statusCode: 303 });
      try {
        await ABClient.ensureLoggedIn();
      } catch {
        return;
      }
      expect.fail('Did not throw');
    });
  });

  describe('upload', () => {
    let loggedInStub: SinonStub;
    let fetchStub: SinonStub;
    let fakeEpisode: Episode;
    const fakeMediaInfo: any = { audio: 'audio', audiochannels: 'channels', codec: 'codec', text: 'text' };

    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({ torrent_dir: 'tdir' } as any);
      loggedInStub = sandbox.stub(ABClient, 'ensureLoggedIn');
      fetchStub = sandbox.stub(ABClient, 'got').resolves({ statusCode: 302, body: 'hi' });
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

    it('Calls ensureLoggedIn', async () => {
      await ABClient.upload(fakeEpisode, fakeMediaInfo);
      assert.calledOnce(loggedInStub);
    });

    it('Throws error if no groupID', async () => {
      fakeEpisode.groupID = undefined as any;
      try {
        await ABClient.upload(fakeEpisode, fakeMediaInfo);
      } catch {
        return;
      }
      expect.fail('Did not throw');
    });

    it('Calls fetch with proper URL', async () => {
      await ABClient.upload(fakeEpisode, fakeMediaInfo);
      assert.calledOnce(fetchStub);
      const args = fetchStub.getCall(0).args;
      expect(args[0]).to.equal('http://example.com/upload.php?type=anime&groupid=groupid');
      expect(args[1].method).to.equal('POST');
      // I don't think there's a way to pull params off of FormData for some reason, so I can't explicitly check request body here
    });

    it('Returns if receieved a 409 (conflict)', async () => {
      fetchStub.resolves({ statusCode: 409, body: 'hi' });
      await ABClient.upload(fakeEpisode, fakeMediaInfo);
    });

    it('Returns if torrent already exists', async () => {
      fetchStub.resolves({ statusCode: 200, body: 'torrent file already exists' });
      await ABClient.upload(fakeEpisode, fakeMediaInfo);
    });

    it('Throws an error for non-200 response', async () => {
      fetchStub.resolves({ statusCode: 400, body: 'hi' });
      try {
        await ABClient.upload(fakeEpisode, fakeMediaInfo);
      } catch {
        return;
      }
      expect.fail('Did not throw');
    });

    it('Throws an error if `the following error` found in response body', async () => {
      fetchStub.resolves({ statusCode: 200, body: 'the following error' });
      try {
        await ABClient.upload(fakeEpisode, fakeMediaInfo);
      } catch {
        return;
      }
      expect.fail('Did not throw');
    });
  });

  describe('getShows', () => {
    let loggedInStub: SinonStub;
    let fetchStub: SinonStub;

    beforeEach(() => {
      loggedInStub = sandbox.stub(ABClient, 'ensureLoggedIn');
      fetchStub = sandbox.stub(ABClient, 'got').resolves({ statusCode: 200, body: Buffer.from('hi') });
    });

    it('Calls ensureLoggedIn', async () => {
      await ABClient.getShows();
      assert.calledOnce(loggedInStub);
    });

    it('Returns the raw buffer from the fetch body', async () => {
      expect(Buffer.from('hi').equals(await ABClient.getShows())).to.be.true;
    });

    it('Throws an error on bad fetch status', async () => {
      fetchStub.resolves({ statusCode: 400 });
      try {
        await ABClient.getShows();
      } catch {
        return;
      }
      expect.fail('Did not throw');
    });
  });
});
