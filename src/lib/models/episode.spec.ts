import { SinonSandbox, createSandbox, SinonStub, assert, useFakeTimers, SinonFakeTimers } from 'sinon';
import { expect } from 'chai';
import { readFile } from 'fs';
import mock from 'mock-fs';

import { LevelDB } from '../clients/leveldb.js';
import { Config } from '../clients/config.js';
import { MediaInfo } from '../clients/mediainfo.js';
import { MkTorrent } from '../clients/mktorrent.js';
import { ABClient } from '../clients/animebytes.js';
import { IRCManager } from '../clients/irc/manager.js';
import { Fetcher } from './fetchers/fetcher.js';
import { Episode } from './episode.js';

describe('Source', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('restartEpisodeFetchingFromState', () => {
    let fromStorageMock: SinonStub;
    let dbListMock: SinonStub;
    let episodeStub: any;

    beforeEach(() => {
      episodeStub = { fetchEpisode: sandbox.stub() };
      fromStorageMock = sandbox.stub(Episode, 'fromStorageJSON').returns(episodeStub);
      dbListMock = sandbox.stub(LevelDB, 'list');
    });

    it('Does not create episodes for state that is complete', async () => {
      dbListMock.resolves([{ state: 'complete' }]);
      await Episode.start();
      assert.notCalled(fromStorageMock);
    });

    it('Starts episode fetch for items recovered from state', async () => {
      dbListMock.resolves([{ state: 'fetching' }]);
      await Episode.start();
      assert.calledOnceWithExactly(fromStorageMock, { state: 'fetching' });
      assert.calledOnce(episodeStub.fetchEpisode);
    });
  });

  describe('isAlreadyComplete', () => {
    let getMock: SinonStub;
    let episode: Episode;

    beforeEach(() => {
      getMock = sandbox.stub(LevelDB, 'get');
      episode = new Episode();
      sandbox.stub(episode, 'levelDBKey').returns('dbkey');
      sandbox.stub(episode, 'formattedName').returns('formattedName');
    });

    it("Returns false if LevelDB.get fails with NotFound (doesn't yet exist)", async () => {
      getMock.throws({ code: 'LEVEL_NOT_FOUND' });
      expect(await episode.isAlreadyComplete()).to.be.false;
    });

    it('Returns false if existing state from database is not marked as complete', async () => {
      getMock.resolves({ state: 'failed' });
      expect(await episode.isAlreadyComplete()).to.be.false;
    });

    it('Returns true if existing state from db is marked as complete', async () => {
      getMock.resolves({ state: 'complete' });
      expect(await episode.isAlreadyComplete()).to.be.true;
    });

    it('Returns true if unexpected error from db', async () => {
      getMock.throws(new Error('Some error message'));
      expect(await episode.isAlreadyComplete()).to.be.true;
    });
  });

  describe('fetchEpisode', () => {
    let fakeFetcher: any;
    let episode: Episode;
    let saveStateStub: SinonStub;
    let mktorrentStub: SinonStub;
    let mediainfoStub: SinonStub;
    let uploadStub: SinonStub;

    beforeEach(() => {
      fakeFetcher = { fetch: sandbox.stub() };
      Episode.fetchingEpisodesCache = {};
      episode = new Episode();
      episode.saveFileName = 'saveFileName';
      sandbox.stub(episode, 'formattedName').returns('formattedName');
      sandbox.stub(episode, 'isAlreadyComplete').resolves(false);
      saveStateStub = sandbox.stub(episode, 'saveToState');
      sandbox.stub(episode, 'getStoragePath').returns('storagepath');
      sandbox.stub(Fetcher, 'createFetcher').returns(fakeFetcher);
      sandbox.stub(IRCManager, 'controlAnnounce');
      mktorrentStub = sandbox.stub(MkTorrent, 'make');
      mediainfoStub = sandbox.stub(MediaInfo, 'get');
      uploadStub = sandbox.stub(ABClient, 'upload');
      mock({
        '/torrents': {},
        '/tmp/saveFileName.torrent': 'data',
      });
      sandbox.stub(Config, 'getConfig').returns({ storage: { transient_dir: '/tmp', torrents_dir: '/torrents' } } as any);
    });

    it('Does not do anything if file is in episodeCache', async () => {
      Episode.fetchingEpisodesCache.saveFileName = true as any;
      await episode.fetchEpisode();
      assert.notCalled(fakeFetcher.fetch);
    });

    it('Does not do anything if isAlreadyComplete from state returns true', async () => {
      (episode.isAlreadyComplete as any).resolves(true);
      await episode.fetchEpisode();
      assert.notCalled(fakeFetcher.fetch);
    });

    it('Saves failed to state on unexpected failure', async () => {
      fakeFetcher.fetch.throws(new Error('Stub error message for testing purposes'));
      await episode.fetchEpisode();
      assert.calledOnceWithExactly(saveStateStub, 'failed', 'Error: Stub error message for testing purposes');
    });

    it('Gets mediainfo of the download', async () => {
      await episode.fetchEpisode();
      assert.calledOnceWithExactly(mediainfoStub, 'storagepath', 'saveFileName');
    });

    it('Makes a torrent file of the download', async () => {
      await episode.fetchEpisode();
      assert.calledOnceWithExactly(mktorrentStub, episode);
    });

    it('Calls AB upload with episode and mediainfo', async () => {
      mediainfoStub.resolves('info');
      await episode.fetchEpisode();
      assert.calledOnceWithExactly(uploadStub, episode, 'info');
    });

    it('Moves torrent file from temporary to torrents directory', (done) => {
      episode.fetchEpisode().then(() => {
        readFile('/torrents/saveFileName.torrent', (err, data) => {
          // ensure file moved to final path
          expect(!!err).to.be.false;
          expect(data.toString()).to.equal('data'); // check file contents
          done();
        });
      });
    });

    it('Saves to state', async () => {
      await episode.fetchEpisode();
      assert.calledWithExactly(saveStateStub.getCall(0), 'fetching');
      assert.calledWithExactly(saveStateStub.getCall(1), 'uploading');
      assert.calledWithExactly(saveStateStub.getCall(2), 'complete');
    });
  });

  describe('getStoragePath', () => {
    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({ storage: { persistent_dir: '/dir' } } as any);
    });

    it('Returns expected path', () => {
      const episode = new Episode();
      episode.saveFileName = 'file.name';
      expect(episode.getStoragePath()).to.equal('/dir/file.name');
    });
  });

  describe('getTorrentPath', () => {
    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({ storage: { transient_dir: '/dir' } } as any);
    });

    it('Returns expected path', () => {
      const episode = new Episode();
      episode.saveFileName = 'file.name';
      expect(episode.getTorrentPath()).to.equal('/dir/file.name.torrent');
    });
  });

  describe('formattedName', () => {
    it('Uses existing computed formattedName if it exists', () => {
      const episode = new Episode();
      episode.formattedFileName = 'thing';
      expect(episode.formattedName()).to.equal('thing');
    });

    it('Formats name as expected', () => {
      const episode = new Episode();
      episode.episode = 2;
      episode.showName = 'showname';
      episode.version = 1;
      episode.resolution = 'resolution';
      episode.groupName = 'groupName';
      episode.container = 'container';
      expect(episode.formattedName()).to.equal('showname - 02 [resolution][groupName].container');
    });

    it('Formats name with version if version > 1', () => {
      const episode = new Episode();
      episode.episode = 2;
      episode.showName = 'showname';
      episode.version = 2;
      episode.resolution = 'resolution';
      episode.groupName = 'groupName';
      episode.container = 'container';
      expect(episode.formattedName()).to.equal('showname - 02v2 [resolution][groupName].container');
    });

    it('Formats name with crc if it exists', () => {
      const episode = new Episode();
      episode.episode = 2;
      episode.showName = 'showname';
      episode.version = 1;
      episode.resolution = 'resolution';
      episode.groupName = 'groupName';
      episode.container = 'container';
      episode.crc = 'crc';
      expect(episode.formattedName()).to.equal('showname - 02 [resolution][groupName][crc].container');
    });

    it('Saves formatted name for future use', () => {
      const episode = new Episode();
      episode.episode = 2;
      episode.showName = 'showname';
      episode.version = 1;
      episode.resolution = 'resolution';
      episode.groupName = 'groupName';
      episode.container = 'container';
      episode.formattedName();
      expect(episode.formattedFileName).to.equal('showname - 02 [resolution][groupName].container');
    });
  });

  describe('levelDBKey', () => {
    let episode: Episode;

    beforeEach(() => {
      episode = new Episode();
      sandbox.stub(episode, 'formattedName').returns('formattedName');
    });

    it('Returns expected key', () => {
      expect(episode.levelDBKey()).to.equal('file::formattedName');
    });
  });

  describe('deleteFromState', () => {
    let deleteMock: SinonStub;
    let episode: Episode;

    beforeEach(() => {
      deleteMock = sandbox.stub(LevelDB, 'delete');
      episode = new Episode();
      sandbox.stub(episode, 'levelDBKey').returns('dbkey');
    });

    it('Calls delete on DB', async () => {
      await episode.deleteFromState();
      assert.calledOnceWithExactly(deleteMock, 'dbkey');
    });
  });

  describe('saveToState', () => {
    let getMock: SinonStub;
    let putMock: SinonStub;
    let episode: Episode;
    let clock: SinonFakeTimers;

    beforeEach(() => {
      clock = useFakeTimers(new Date(1585970425775));
      getMock = sandbox.stub(LevelDB, 'get');
      putMock = sandbox.stub(LevelDB, 'put');
      episode = new Episode();
      sandbox.stub(episode, 'levelDBKey').returns('dbkey');
      sandbox.stub(episode, 'asStorageJSON').returns({ thing: 'whatever' } as any);
    });

    afterEach(() => {
      clock.restore();
    });

    it('Calls DB get to check for existing state', async () => {
      getMock.resolves({ state: 'thing', created: 'thing' });
      await episode.saveToState('complete');
      assert.calledOnceWithExactly(getMock, 'dbkey');
    });

    it('Calls DB put with expected params when no existing state exists', async () => {
      getMock.throws({ code: 'LEVEL_NOT_FOUND' });
      await episode.saveToState('complete');
      assert.calledOnceWithExactly(putMock, 'dbkey', {
        thing: 'whatever',
        created: 'Sat, 04 Apr 2020 03:20:25 GMT',
        error: undefined,
        lastState: '',
        modified: 'Sat, 04 Apr 2020 03:20:25 GMT',
        state: 'complete',
      });
    });

    it('Calls DB put with expected params when no existing state exists', async () => {
      getMock.resolves({ state: 'oldState', created: 'sometime' });
      await episode.saveToState('complete');
      assert.calledOnceWithExactly(putMock, 'dbkey', {
        thing: 'whatever',
        created: 'sometime',
        error: undefined,
        lastState: 'oldState',
        modified: 'Sat, 04 Apr 2020 03:20:25 GMT',
        state: 'complete',
      });
    });
  });

  describe('getProgressString', () => {
    it('Returns pending if state is not defined', () => {
      const episode = new Episode();
      expect(episode.getProgressString()).to.equal('pending');
    });

    it('Returns the state if no fetcher is defined', () => {
      const episode = new Episode();
      episode.state = 'uploading';
      expect(episode.getProgressString()).to.equal('uploading');
    });

    it('Returns string with with fetch numbers if fetcher is defined', () => {
      const episode = new Episode();
      episode.state = 'fetching';
      episode.fetcher = {
        length: 12345678,
        fetched: 7654321,
      } as any;
      expect(episode.getProgressString()).to.equal('fetching - 7.3MB/11.8MB (62.00%)');
    });
  });

  describe('toStorageJSON', () => {
    const episode = new Episode();
    episode.episode = 2;
    episode.version = 1;
    episode.resolution = 'resolution';
    episode.container = 'container';
    episode.crc = 'crc';
    episode.saveFileName = 'saveFileName';
    episode.showName = 'showName';
    episode.groupID = 'groupID';
    episode.media = 'media';
    episode.subbing = 'subbing';
    episode.groupName = 'groupName';
    episode.fetchType = 'fetchType';
    episode.fetchOptions = { url: 'whatever' };
    expect(episode.asStorageJSON()).to.deep.equal({
      showName: 'showName',
      episode: 2,
      version: 1,
      resolution: 'resolution',
      container: 'container',
      crc: 'crc',
      saveFileName: 'saveFileName',
      groupID: 'groupID',
      media: 'media',
      subbing: 'subbing',
      groupName: 'groupName',
      fetchType: 'fetchType',
      fetchOptions: { url: 'whatever' },
    });
  });

  describe('fromStorageJSON', () => {
    it('Creates an episode with correctly set params from input', () => {
      const episode = Episode.fromStorageJSON({
        showName: 'showName',
        episode: 2,
        version: 1,
        resolution: 'resolution',
        container: 'container',
        crc: 'crc',
        saveFileName: 'saveFileName',
        groupID: 'groupID',
        media: 'media',
        subbing: 'subbing',
        groupName: 'groupName',
        fetchType: 'fetchType',
        fetchOptions: { url: 'whatever' },
      });
      expect(episode.showName).to.equal('showName');
      expect(episode.episode).to.equal(2);
      expect(episode.version).to.equal(1);
      expect(episode.resolution).to.equal('resolution');
      expect(episode.container).to.equal('container');
      expect(episode.crc).to.equal('crc');
      expect(episode.saveFileName).to.equal('saveFileName');
      expect(episode.groupID).to.equal('groupID');
      expect(episode.media).to.equal('media');
      expect(episode.subbing).to.equal('subbing');
      expect(episode.groupName).to.equal('groupName');
      expect(episode.fetchType).to.equal('fetchType');
      expect(episode.fetchOptions).to.deep.equal({ url: 'whatever' });
    });
  });
});
