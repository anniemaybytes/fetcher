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

    beforeEach(() => {
      execStub = sandbox.stub().resolves(undefined);
      fsStub = sandbox.stub().resolves(undefined);

      sandbox.replace(MkTorrent, 'exec', execStub);
      sandbox.replace(MkTorrent, 'fs', { unlink: fsStub } as any);

      sandbox.stub(Config, 'getConfig').returns({
        mktorrent: { tracker_uri: 'http://tracker.example.com/announce', source_field: 'example.com' },
      } as any);
    });

    it('Calls execFile with correct params', async () => {
      await MkTorrent.make('filename.torrent', '/persistent/filename.txt');
      assert.calledOnce(execStub);
      expect(execStub.getCall(0).args[0]).to.equal('/usr/bin/env');
      expect(execStub.getCall(0).args[1]).to.deep.equal([
        'mktorrent',
        '-l',
        '19',
        '-p',
        '-s',
        'example.com',
        '-a',
        'http://tracker.example.com/announce',
        '-o',
        'filename.torrent',
        '/persistent/filename.txt',
      ]);
    });

    it('Throws on unexpected error', async () => {
      const error = new Error();
      execStub.rejects(error);
      try {
        await MkTorrent.make('filename.torrent', '/persistent/filename.txt');
      } catch (e) {
        expect(e).to.equal(error);
        return;
      }
      expect.fail('Did not throw');
    });

    it('Deletes existing torrent file if it exists and retries', async () => {
      execStub.rejects({ message: 'file exists' });
      try {
        await MkTorrent.make('filename.torrent', '/persistent/filename.txt');
      } catch {
        assert.calledOnceWithExactly(fsStub, 'filename.torrent');
        assert.calledTwice(execStub);
        return;
      }
      expect.fail('Did not throw');
    });
  });
});
