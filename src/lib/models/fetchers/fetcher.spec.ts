import { SinonSandbox, createSandbox, assert } from 'sinon';
import { expect } from 'chai';

import { Fetcher } from './fetcher.js';

describe('Fetcher', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
    Fetcher.registered = {};
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('registerFetcherType', () => {
    it('Adds a static fetcher type', () => {
      Fetcher.registerFetcherType('thing', 'something');
      expect(Fetcher.registered.thing).to.equal('something');
    });
  });

  describe('createFetcher', () => {
    it('Throws an error when trying to create an invalid type', () => {
      try {
        Fetcher.createFetcher('badtype', 'abc', {});
      } catch {
        return;
      }
      expect.fail('Did not throw');
    });

    it('Uses registered static fetcher', () => {
      Fetcher.registered.test = sandbox.stub();
      Fetcher.createFetcher('test', 'abc', {});
      assert.calledOnceWithExactly(Fetcher.registered.test, 'abc', {});
    });
  });
});
