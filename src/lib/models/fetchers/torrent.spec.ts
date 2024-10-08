import { SinonSandbox, createSandbox, assert, useFakeTimers } from 'sinon';
import { expect } from 'chai';
import { readFile } from 'fs';
import mock from 'mock-fs';
import { EventEmitter } from 'events';

import { Config } from '../../clients/config.js';
import { TorrentFetcher } from './torrent.js';

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
    it('Assigns relevant parameters', () => {
      const fetcher = new TorrentFetcher('path', { uri: 'thing' });
      expect(fetcher.uri).to.equal('thing');
      expect(fetcher.path).to.equal('path');
    });
  });

  describe('shutdown', () => {
    it('Calls destroy on client', (done) => {
      TorrentFetcher.shutDown().then(() => {
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
      sandbox.stub(Config, 'getConfig').returns({ storage: { transient_dir: '/test' } } as any);
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

    it('Calls client add with correct params', (done) => {
      fetcher.fetch().then(() => {
        assert.calledOnceWithExactly(fakeClient.add, 'torrentURI', { path: '/test' });
        done();
      });
      fakeTorrent.emit('ready');
      fakeTorrent.emit('done');
    });

    it('Updates fetched on the fetcher with download event', (done) => {
      fakeTorrent.downloaded = 12;
      fetcher.fetch().then(() => {
        expect(fetcher.fetched).to.equal(12);
        done();
      });
      fakeTorrent.emit('ready');
      fakeTorrent.emit('download');
      fakeTorrent.emit('done');
    });

    it('Pauses, destroys, and moves torrent upon completion', (done) => {
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

    it('Throws on torrent error', (done) => {
      fetcher.fetch().catch((err) => {
        expect(err).to.equal('broken');
        done();
      });
      fakeTorrent.emit('ready');
      fakeTorrent.emit('error', 'broken');
    });

    it('Throws on noPeers after timeout', (done) => {
      fakeTorrent.numPeers = 0;
      fakeTorrent.progress = 15;
      clock = useFakeTimers();
      fetcher.fetch().catch((err) => {
        assert.calledOnce(fakeTorrent.destroy);
        expect(String(err)).to.equal(`Error: Torrent has seen no peers for ${TorrentFetcher.noPeerTimeout / 1000} seconds`);
        done();
      });
      fakeTorrent.emit('ready');
      clock.tick(500000);
      fakeTorrent.emit('noPeers');
    });

    it('Throws if torrent has more than 1 file', (done) => {
      fakeTorrent.files = ['more', 'than', 'one'];
      fetcher.fetch().catch((err) => {
        assert.calledOnce(fakeTorrent.destroy);
        expect(String(err)).to.equal('Error: Torrent has 3 files, must have 1');
        done();
      });
      fakeTorrent.emit('ready');
    });

    it('Throws if fetching metadata takes too long', (done) => {
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

    it('Sets aborted on the fetcher', async () => {
      await fetcher.abortFetch();
      expect(fetcher.aborted).to.be.true;
    });

    it('Calls abort function if it exists', async () => {
      fetcher.abort = sandbox.stub() as any;
      await fetcher.abortFetch();
      assert.calledOnce(fetcher.abort as any);
    });
  });
});
