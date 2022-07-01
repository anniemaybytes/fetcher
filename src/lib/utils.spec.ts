import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';

import { Utils } from './utils.js';

describe('Utils', () => {
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
      await Utils.sleep(10);
      expect(Date.now() - 9).to.be.gte(now);
    });
  });

  describe('timeoutPromise', () => {
    it('Rejects with provided error if provided promise does not resolve within timeout', async () => {
      const longPromise = new Promise((resolve) => setTimeout(resolve, 5000));
      try {
        await Utils.timeoutPromise(longPromise, 1, 'my error');
      } catch (e) {
        expect(e).to.equal('my error');
        return;
      }
      expect.fail('Did not throw');
    });

    it('Returns value from provided promise if it resolves before the timeout', async () => {
      const shortPromise = new Promise((resolve) => setTimeout(() => resolve('my return'), 1));
      expect(await Utils.timeoutPromise(shortPromise, 10, 'err')).to.equal('my return');
    });
  });

  describe('retry', () => {
    let fnStub: SinonStub;
    let sleepStub: SinonStub;

    beforeEach(() => {
      fnStub = sandbox.stub();
      sleepStub = sandbox.stub();
      sandbox.replace(Utils, 'sleep', sleepStub);
    });

    it('Throws error and does not call function if times is less than 0', async () => {
      try {
        await Utils.retry(fnStub, -1);
      } catch (e) {
        assert.notCalled(fnStub);
        return;
      }
      expect.fail('Did not throw');
    });

    it('Calls provided function correct number of times when erroring', async () => {
      fnStub.throws('bleh');
      const retries = 4;
      try {
        await Utils.retry(fnStub, retries);
      } catch (e) {
        assert.callCount(fnStub, retries + 1);
        return;
      }
      expect.fail('Did not throw');
    });

    it('Returns value from provided function return value', async () => {
      const expectedReturn = 'hello';
      fnStub.resolves(expectedReturn);
      const actualReturn = await Utils.retry(fnStub);
      expect(actualReturn).to.equal(expectedReturn);
    });

    it('Only calls provided function once if succeeding', async () => {
      await Utils.retry(fnStub, 3);
      assert.calledOnce(fnStub);
    });

    it('Throws error from provided function if failing after all retries', async () => {
      const err = new Error('it broke');
      fnStub.throws(err);
      try {
        await Utils.retry(fnStub, 1);
      } catch (e) {
        expect(e).to.equal(err);
        return;
      }
      expect.fail('Did not throw');
    });

    it('Only waits provided time after first failure', async () => {
      const waitTime = 123;
      fnStub.onFirstCall().throws('err');
      await Utils.retry(fnStub, 3, waitTime);
      assert.calledWithExactly(sleepStub.firstCall, 0);
      assert.calledWithExactly(sleepStub.secondCall, waitTime);
      sleepStub.secondCall.calledAfter(fnStub.firstCall);
    });

    it('Waits provided time x retry count for multiple failures', async () => {
      const initialWaitTime = 123;
      fnStub.throws('err');
      try {
        await Utils.retry(fnStub, 3, initialWaitTime);
      } catch {} // eslint-disable-line no-empty
      assert.callCount(sleepStub, 4);
      assert.calledWithExactly(sleepStub.getCall(2), initialWaitTime * 2);
      assert.calledWithExactly(sleepStub.getCall(3), initialWaitTime * 3);
    });
  });
});
