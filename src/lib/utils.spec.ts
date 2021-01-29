import { SinonSandbox, createSandbox } from 'sinon';
import { expect } from 'chai';
import * as utils from './utils';

describe('utils', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('sleep', () => {
    it('Stops execution for specified amount of time', async () => {
      const now = Date.now();
      await utils.sleep(10);
      expect(Date.now() - 9).to.be.gte(now);
    });
  });

  describe('timeoutPromise', () => {
    it('Rejects with provided error if provided promise does not resolve within timeout', async () => {
      const longPromise = new Promise((resolve) => setTimeout(resolve, 5000));
      try {
        await utils.timeoutPromise(longPromise, 1, 'my error');
      } catch (e) {
        expect(e).to.equal('my error');
      }
    });

    it('Returns value from provided promise if it resolves before the timeout', async () => {
      const shortPromise = new Promise((resolve) => setTimeout(() => resolve('my return'), 1));
      expect(await utils.timeoutPromise(shortPromise, 10, 'err')).to.equal('my return');
    });
  });
});
