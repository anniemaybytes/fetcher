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
    it('stops execution for specified amount of time', async () => {
      const now = Date.now();
      await utils.sleep(10);
      expect(Date.now() - 9).to.be.gte(now);
    });
  });
});
