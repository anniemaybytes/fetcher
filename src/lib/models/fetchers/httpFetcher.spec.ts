import { SinonSandbox, createSandbox, useFakeTimers } from 'sinon';
import { expect } from 'chai';
import streamBuffers from 'stream-buffers';
import mock from 'mock-fs';
import { Config } from '../../clients/config';
import { HTTPFetcher } from './httpFetcher';
import { readFile } from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);

describe('HTTPFetcher', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('assigns relevant parameters', () => {
      const fetcher = new HTTPFetcher('/path', { url: 'thing' });
      expect(fetcher.url).to.equal('thing');
      expect(fetcher.path).to.equal('/path');
    });
  });

  describe('fetch', () => {
    let fakeFetch: any;
    let fetchCmd: any;
    let fakeSocket: streamBuffers.ReadableStreamBuffer;
    let clock: any;

    beforeEach(() => {
      fakeSocket = new streamBuffers.ReadableStreamBuffer();
      fakeFetch = sandbox.stub().resolves({
        ok: true,
        headers: {
          get: () => '4', // fake content length
        },
        body: fakeSocket,
      });
      HTTPFetcher.nodefetch = fakeFetch;
      const httpFetcher = new HTTPFetcher('/path/file.ok', { url: 'url' });
      fetchCmd = httpFetcher.fetch.bind(httpFetcher);
      sandbox.stub(Config, 'getConfig').returns({ temporary_dir: '/dir' } as any);
      clock = undefined;
      mock({ '/path': {}, '/dir': {} });
    });

    afterEach(() => {
      if (clock) clock.restore();
      mock.restore();
    });

    it('throws if fetch response is not ok', async () => {
      fakeFetch.resolves({ ok: false });
      try {
        await fetchCmd();
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('throws if content-length is not provided', (done) => {
      fakeFetch.resolves({ ok: true, headers: { get: () => undefined } });
      fetchCmd().catch(() => done());
    });

    it('throws an error if it takes too long to get data', (done) => {
      clock = useFakeTimers({ shouldAdvanceTime: true });
      fetchCmd().catch(() => done());
      // emulate timeout
      setTimeout(() => {
        clock.tick(20000);
      }, 1);
    });

    it('throws an error if request body has an error', (done) => {
      fetchCmd().catch(() => done());
      // so this isn't thrown before listeners are set up
      setTimeout(() => fakeSocket.destroy(new Error('error')), 1);
    });

    it('writes request body to disk and moves to path on completion', async () => {
      const promise = fetchCmd();
      // so this isn't resolved before the listener
      setTimeout(() => {
        fakeSocket.put('data');
        setTimeout(() => {
          fakeSocket.stop();
          fakeSocket.emit('close');
        }, 1);
      }, 5);
      await promise;
      expect(await readFileAsync('/path/file.ok', 'utf8')).to.equal('data');
    });
  });
});
