import { createSandbox, SinonSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { Config } from './config';
import proxyquire from 'proxyquire';

describe('mktorrent', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('makeTorrentFile', () => {
    let makeTorrentFile: any;
    let execStub: SinonStub;
    let unlinkStub: SinonStub;
    let episodeStub: any;

    beforeEach(() => {
      execStub = sandbox.stub().yields(undefined);
      unlinkStub = sandbox.stub().yields(undefined);
      makeTorrentFile = proxyquire('./mktorrent', {
        child_process: { execFile: execStub },
        fs: { unlink: unlinkStub },
      }).makeTorrentFile;
      episodeStub = {
        getStoragePath: sandbox.stub(),
        getTorrentPath: sandbox.stub(),
      };
      sandbox.stub(Config, 'getConfig').returns({ tracker_url: 'trackerurl', tracker_source: 'trackersource' } as any);
    });

    it('calls getStoragePath and getTorrentPath on the provided episode', async () => {
      await makeTorrentFile(episodeStub);
      assert.calledOnce(episodeStub.getStoragePath);
      assert.calledOnce(episodeStub.getTorrentPath);
    });

    it('calls execFile with correct params', async () => {
      episodeStub.getStoragePath.returns('storagepath');
      episodeStub.getTorrentPath.returns('torrentpath');
      await makeTorrentFile(episodeStub);
      assert.calledOnce(execStub);
      expect(execStub.getCall(0).args[0]).to.equal('/usr/bin/env');
      expect(execStub.getCall(0).args[1]).to.deep.equal([
        'mktorrent',
        '-l',
        '19',
        '-p',
        '-a',
        'trackerurl',
        'storagepath',
        '-o',
        'torrentpath',
        '-s',
        'trackersource',
      ]);
    });

    it('throws on unexpected error', async () => {
      execStub.yields('thing');
      try {
        await makeTorrentFile(episodeStub);
        expect.fail('did not throw');
      } catch (e) {
        expect(e).to.equal('thing');
      }
    });

    it('deletes existing torrent file if it exists and retries', async () => {
      execStub.yields({ message: 'file exists' });
      try {
        await makeTorrentFile(episodeStub);
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
      assert.calledOnce(unlinkStub);
      assert.calledTwice(execStub);
    });
  });
});
