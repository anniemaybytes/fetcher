import { SinonSandbox, createSandbox, assert, useFakeTimers } from 'sinon';
import { expect } from 'chai';
import { readFile } from 'fs';
import mock from 'mock-fs';
import { EventEmitter } from 'events';
import { Config } from '../../clients/config';
import { TorrentFetcher } from './torrentFetcher';

describe('TorrentFetcher', () => {
  let sandbox: SinonSandbox;
  let fakeClient: any;

  beforeEach(() => {
    sandbox = createSandbox();
    fakeClient = {
      destroy: sandbox.stub(),
      torrents: [],
      add: sandbox.stub(),
    };
    TorrentFetcher.client = fakeClient;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('assigns relevant parameters', () => {
      const fetcher = new TorrentFetcher('path', { uri: 'thing' });
      expect(fetcher.uri).to.equal('thing');
      expect(fetcher.path).to.equal('path');
    });
  });

  describe('shutdown', () => {
    it('calls destroy on client', (done) => {
      TorrentFetcher.shutdown().then(() => {
        assert.calledOnce(fakeClient.destroy);
        done();
      });
      setTimeout(() => fakeClient.destroy.callArg(0), 1);
    });
  });

  describe('fetch', () => {
    let fakeTorrent: any;
    let fetcher: TorrentFetcher;
    let clock: any;

    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({ temporary_dir: '/test' } as any);
      fakeTorrent = new EventEmitter();
      fakeTorrent.destroy = sandbox.stub();
      fakeTorrent.pause = sandbox.stub();
      fakeTorrent.files = [{ path: '/torrentFileDownloadPath' }];
      fakeTorrent.length = 123;
      fakeClient.add.returns(fakeTorrent);
      fetcher = new TorrentFetcher('/finalPath', { uri: 'torrentURI' });
      mock({
        '/torrentFileDownloadPath': 'data',
      });
    });

    afterEach(() => {
      if (clock) clock.restore();
      mock.restore();
    });

    it('calls client add with correct params', (done) => {
      fetcher.fetch().then(() => {
        assert.calledOnceWithExactly(fakeClient.add, 'torrentURI', { path: '/test' });
        done();
      });
      fakeTorrent.emit('ready');
      fakeTorrent.emit('done');
    });

    it('updates fetched on the fetcher with download event', (done) => {
      fakeTorrent.downloaded = 12;
      fetcher.fetch().then(() => {
        expect(fetcher.fetched).to.equal(12);
        done();
      });
      fakeTorrent.emit('ready');
      fakeTorrent.emit('download');
      fakeTorrent.emit('done');
    });

    it('pauses, destroys, and moves torrent upon completion', (done) => {
      fetcher.fetch().then(() => {
        assert.calledOnce(fakeTorrent.pause);
        assert.calledOnce(fakeTorrent.destroy);
        readFile('/finalPath', (err, data) => {
          // ensure file moved to final path
          expect(!!err).to.be.false;
          expect(data.toString()).to.equal('data'); // check file contents
          done();
        });
      });
      fakeTorrent.emit('ready');
      fakeTorrent.emit('done');
    });

    it('throws on torrent error', (done) => {
      fetcher.fetch().catch((err) => {
        expect(err).to.equal('broken');
        done();
      });
      fakeTorrent.emit('ready');
      fakeTorrent.emit('error', 'broken');
    });

    it('throws on noPeers after timeout', (done) => {
      fakeTorrent.numPeers = 0;
      fakeTorrent.progress = 0.5;
      clock = useFakeTimers();
      fetcher.fetch().catch((err) => {
        assert.calledOnce(fakeTorrent.destroy);
        expect(String(err)).to.equal('Error: torrent has no peers');
        done();
      });
      fakeTorrent.emit('ready');
      clock.tick(500000);
      fakeTorrent.emit('noPeers');
    });

    it('throws if torrent has more than 1 file', (done) => {
      fakeTorrent.files = ['more', 'than', 'one'];
      fetcher.fetch().catch((err) => {
        assert.calledOnce(fakeTorrent.destroy);
        expect(String(err)).to.equal('Error: torrent has 3 files, must have 1');
        done();
      });
      fakeTorrent.emit('ready');
    });

    it('throws if fetching metadata takes too long', (done) => {
      clock = useFakeTimers();
      fetcher.fetch().catch((err) => {
        assert.calledOnce(fakeTorrent.destroy);
        expect(String(err)).to.equal('Error: Took too long or failed to fetch metadata');
        done();
      });
      clock.tick(100000);
    });
  });

  describe('abortFetch', () => {
    let fetcher: TorrentFetcher;

    beforeEach(() => {
      fetcher = new TorrentFetcher('/finalPath', { uri: 'torrentURI' });
    });

    it('sets aborted on the fetcher', async () => {
      await fetcher.abortFetch();
      expect(fetcher.aborted).to.be.true;
    });

    it('calls abort function if it exists', async () => {
      fetcher.abort = sandbox.stub() as any;
      await fetcher.abortFetch();
      assert.calledOnce(fetcher.abort as any);
    });
  });
});
