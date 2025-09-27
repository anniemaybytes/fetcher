import { SinonSandbox, createSandbox, assert } from 'sinon';
import { expect } from 'chai';
import streamBuffers from 'stream-buffers';
import { promises as fs } from 'fs';
import mock from 'mock-fs';

import { Config } from '../../clients/config.js';
import { HTTPFetcher } from './http.js';

describe('HTTPFetcher', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('Assigns relevant parameters', () => {
      const fetcher = new HTTPFetcher({ url: 'http://example.com/filename.txt' });
      expect(fetcher.url).to.equal('http://example.com/filename.txt');
    });
  });

  describe('fetch', () => {
    let fakeGot: any;
    let fetchCmd: any;
    let fakeSocket: streamBuffers.ReadableStreamBuffer;

    beforeEach(() => {
      fakeSocket = new streamBuffers.ReadableStreamBuffer();
      fakeGot = sandbox.stub().returns(fakeSocket);
      HTTPFetcher.got.stream = fakeGot;
      const httpFetcher = new HTTPFetcher({ url: 'http://example.com/filename.txt' });
      fetchCmd = httpFetcher.fetch.bind(httpFetcher);
      sandbox.stub(Config, 'getConfig').returns({ storage: { persistent_dir: '/persistent', transient_dir: '/transient' } } as any);
      mock({ '/persistent': {}, '/transient': {} });
    });

    afterEach(() => {
      mock.restore();
    });

    it('Throws if fetch response is not OK', (done) => {
      fetchCmd().catch(() => done());
      fakeSocket.emit('response', { statusCode: 400, request: fakeSocket });
    });

    it('Throws if Content-Length is not provided', (done) => {
      fetchCmd().catch(() => done());
      fakeSocket.emit('response', { statusCode: 200, headers: { 'content-length': undefined }, request: fakeSocket });
    });

    it('Throws an error if request body has an error', (done) => {
      fetchCmd().catch(() => done());
      fakeSocket.emit('error', new Error());
    });

    it('Writes request body to disk and moves to path on completion', async () => {
      const promise = fetchCmd();
      fakeSocket.emit('response', { statusCode: 200, headers: { 'content-length': 4 }, request: fakeSocket });
      // so this isn't resolved before the listener
      setTimeout(() => {
        fakeSocket.put('data');
        setTimeout(() => {
          fakeSocket.stop();
        }, 1);
      }, 5);
      await promise;
      expect(await fs.readFile('/persistent/filename.txt', 'utf8')).to.equal('data');
    });
  });

  describe('abortFetch', () => {
    let fetcher: HTTPFetcher;

    beforeEach(() => {
      fetcher = new HTTPFetcher({ url: 'http://example.com/filename.txt' });
    });

    it('Calls abort function if it exists', async () => {
      fetcher.abort = sandbox.stub() as any;
      await fetcher.abortFetch();
      assert.calledOnce(fetcher.abort as any);
    });
  });
});
