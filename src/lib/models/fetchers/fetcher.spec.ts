import { SinonSandbox, createSandbox, assert } from 'sinon';
import { expect } from 'chai';
import { Fetcher } from './fetcher';

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
    it('adds a static fetcher type', () => {
      Fetcher.registerFetcherType('thing', 'something');
      expect(Fetcher.registered.thing).to.equal('something');
    });
  });

  describe('createFetcher', () => {
    it('throws an error when trying to create an invalid type', () => {
      try {
        Fetcher.createFetcher('badtype', 'abc', {});
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('uses registered static fetcher', () => {
      Fetcher.registered.test = sandbox.stub();
      Fetcher.createFetcher('test', 'abc', {});
      assert.calledOnceWithExactly(Fetcher.registered.test, 'abc', {});
    });
  });
});
