import { createSandbox, SinonSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';

import { MkTorrent } from './mktorrent.js';
import { Config } from './config.js';

describe('MkTorrent', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('make', () => {
    let execStub: SinonStub;
    let fsStub: SinonStub;
    let episodeStub: any;

    beforeEach(() => {
      execStub = sandbox.stub().resolves(undefined);
      fsStub = sandbox.stub().resolves(undefined);

      sandbox.replace(MkTorrent, 'exec', execStub);
      sandbox.replace(MkTorrent, 'fs', { unlink: fsStub } as any);

      episodeStub = {
        getStoragePath: sandbox.stub(),
        getTorrentPath: sandbox.stub(),
      };
      sandbox.stub(Config, 'getConfig').returns({ mktorrent: { tracker_uri: 'trackerurl', source_field: 'trackersource' } } as any);
    });

    it('Calls getStoragePath and getTorrentPath on the provided episode', async () => {
      await MkTorrent.make(episodeStub);
      assert.calledOnce(episodeStub.getStoragePath);
      assert.calledOnce(episodeStub.getTorrentPath);
    });

    it('Calls execFile with correct params', async () => {
      episodeStub.getStoragePath.returns('storagepath');
      episodeStub.getTorrentPath.returns('torrentpath');
      await MkTorrent.make(episodeStub);
      assert.calledOnce(execStub);
      expect(execStub.getCall(0).args[0]).to.equal('/usr/bin/env');
      expect(execStub.getCall(0).args[1]).to.deep.equal([
        'mktorrent',
        '-l',
        '19',
        '-p',
        '-s',
        'trackersource',
        '-a',
        'trackerurl',
        '-o',
        'torrentpath',
        'storagepath',
      ]);
    });

    it('Throws on unexpected error', async () => {
      const error = new Error();
      execStub.rejects(error);
      try {
        await MkTorrent.make(episodeStub);
      } catch (e) {
        expect(e).to.equal(error);
        return;
      }
      expect.fail('Did not throw');
    });

    it('Deletes existing torrent file if it exists and retries', async () => {
      episodeStub.getTorrentPath.returns('torrentpath');
      execStub.rejects({ message: 'file exists' });
      try {
        await MkTorrent.make(episodeStub);
      } catch {
        assert.calledOnceWithExactly(fsStub, 'torrentpath');
        assert.calledTwice(execStub);
        return;
      }
      expect.fail('Did not throw');
    });
  });
});
