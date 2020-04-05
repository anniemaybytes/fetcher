import { SinonSandbox, createSandbox, SinonStub, assert, useFakeTimers, SinonFakeTimers } from 'sinon';
import { expect } from 'chai';
import { LevelDB } from '../clients/leveldb';
import { Config } from '../clients/config';
import * as mediainfo from '../clients/mediainfo';
import * as mktorrent from '../clients/mktorrent';
import { AnimeBytes } from '../clients/animebytes';
import { IRCManager } from '../clients/irc/ircManager';
import { Fetcher } from './fetchers/fetcher';
import { Episode } from './episode';

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

    it('does not create episodes for state that is complete', async () => {
      dbListMock.resolves([{ state: 'complete' }]);
      await Episode.restartEpisodeFetchingFromState();
      assert.notCalled(fromStorageMock);
    });

    it('starts episode fetch for items recovered from state', async () => {
      dbListMock.resolves([{ state: 'fetching' }]);
      await Episode.restartEpisodeFetchingFromState();
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

    it('returns false if db get fails with notfound (doesnt yet exist)', async () => {
      getMock.throws({ type: 'NotFoundError' });
      expect(await episode.isAlreadyComplete()).to.be.false;
    });

    it('returns false if existing state from db is not marked as complete', async () => {
      getMock.resolves({ state: 'failed' });
      expect(await episode.isAlreadyComplete()).to.be.false;
    });

    it('returns true if existing state from db is marked as complete', async () => {
      getMock.resolves({ state: 'complete' });
      expect(await episode.isAlreadyComplete()).to.be.true;
    });

    it('returns true if unexpected error from db', async () => {
      getMock.throws('uh-oh');
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
      sandbox.stub(episode, 'isAlreadyComplete').resolves(false);
      saveStateStub = sandbox.stub(episode, 'saveToState');
      sandbox.stub(episode, 'getStoragePath').returns('storagepath');
      sandbox.stub(Fetcher, 'createFetcher').returns(fakeFetcher);
      sandbox.stub(IRCManager, 'controlAnnounce');
      mktorrentStub = sandbox.stub(mktorrent, 'makeTorrentFile');
      mediainfoStub = sandbox.stub(mediainfo, 'getMediaInfo');
      uploadStub = sandbox.stub(AnimeBytes, 'upload');
    });

    it('does not do anything if file is in episodeCache', async () => {
      Episode.fetchingEpisodesCache.saveFileName = true as any;
      await episode.fetchEpisode();
      assert.notCalled(fakeFetcher.fetch);
    });

    it('does not do anything if isAlreadyComplete from state returns true', async () => {
      (episode.isAlreadyComplete as any).resolves(true);
      await episode.fetchEpisode();
      assert.notCalled(fakeFetcher.fetch);
    });

    it('saves failed to state on unexpected failure', async () => {
      fakeFetcher.fetch.throws('nope'); // unexpected error while fetching
      await episode.fetchEpisode();
      assert.calledOnceWithExactly(saveStateStub, 'failed', 'nope');
    });

    it('gets mediainfo of the download', async () => {
      await episode.fetchEpisode();
      assert.calledOnceWithExactly(mediainfoStub, 'storagepath', 'saveFileName');
    });

    it('makes a torrent file of the download', async () => {
      await episode.fetchEpisode();
      assert.calledOnceWithExactly(mktorrentStub, episode);
    });

    it('calls AB upload with episode and mediainfo', async () => {
      mediainfoStub.resolves('info');
      await episode.fetchEpisode();
      assert.calledOnceWithExactly(uploadStub, episode, 'info');
    });

    it('saves to state', async () => {
      await episode.fetchEpisode();
      assert.calledWithExactly(saveStateStub.getCall(0), 'fetching');
      assert.calledWithExactly(saveStateStub.getCall(1), 'uploading');
      assert.calledWithExactly(saveStateStub.getCall(2), 'complete');
    });
  });

  describe('getStoragePath', () => {
    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({ storage_dir: '/dir' } as any);
    });

    it('returns expected path', () => {
      const episode = new Episode();
      episode.saveFileName = 'file.name';
      expect(episode.getStoragePath()).to.equal('/dir/file.name');
    });
  });

  describe('getTorrentPath', () => {
    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({ torrent_dir: '/dir' } as any);
    });

    it('returns expected path', () => {
      const episode = new Episode();
      episode.saveFileName = 'file.name';
      expect(episode.getTorrentPath()).to.equal('/dir/file.name.torrent');
    });
  });

  describe('formattedName', () => {
    it('uses existing computed formattedName if it exists', () => {
      const episode = new Episode();
      episode.formattedFileName = 'thing';
      expect(episode.formattedName()).to.equal('thing');
    });

    it('formats name as expected', () => {
      const episode = new Episode();
      episode.episode = 2;
      episode.showName = 'showname';
      episode.version = 1;
      episode.resolution = 'resolution';
      episode.groupName = 'groupName';
      episode.container = 'container';
      expect(episode.formattedName()).to.equal('showname - 02 [resolution][groupName].container');
    });

    it('formats name with version if version > 1', () => {
      const episode = new Episode();
      episode.episode = 2;
      episode.showName = 'showname';
      episode.version = 2;
      episode.resolution = 'resolution';
      episode.groupName = 'groupName';
      episode.container = 'container';
      expect(episode.formattedName()).to.equal('showname - 02v2 [resolution][groupName].container');
    });

    it('formats name with crc if it exists', () => {
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

    it('saves formatted name for future use', () => {
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

    it('returns expected key', () => {
      expect(episode.levelDBKey()).to.equal('file::formattedName');
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

    it('calls DB get to check for existing state', async () => {
      getMock.resolves({ state: 'thing', created: 'thing' });
      await episode.saveToState('complete');
      assert.calledOnceWithExactly(getMock, 'dbkey');
    });

    it('calls DB put with expected params when no existing state exists', async () => {
      getMock.throws({ type: 'NotFoundError' });
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

    it('calls DB put with expected params when no existing state exists', async () => {
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
    it('returns pending if state is not defined', () => {
      const episode = new Episode();
      expect(episode.getProgressString()).to.equal('pending');
    });

    it('returns the state if no fetcher is defined', () => {
      const episode = new Episode();
      episode.state = 'uploading';
      expect(episode.getProgressString()).to.equal('uploading');
    });

    it('returns string with with fetch numbers if fetcher is defined', () => {
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
    it('creates an episode with correctly set params from input', () => {
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
