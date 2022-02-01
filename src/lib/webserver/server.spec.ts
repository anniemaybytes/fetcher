import { createSandbox, SinonSandbox, SinonStub, assert } from 'sinon';

import { WebServer } from './server.js';

describe('WebServer', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('start', () => {
    let mockExpress: SinonStub;

    beforeEach(() => {
      mockExpress = sandbox.stub().returns({
        use: sandbox.stub(),
        set: sandbox.stub(),
        listen: sandbox.stub(),
        locals: { basePath: undefined },
      });
    });

    it('Creates and starts an express app when called', () => {
      WebServer.start(mockExpress);
      assert.calledOnce(mockExpress);
      assert.calledOnce(mockExpress.returnValues[0].listen);
    });
  });
});
