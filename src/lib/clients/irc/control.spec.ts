import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { Reloader } from '../../reloader.js';
import { IRCControl } from './control.js';

describe('IRCControl', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handle', () => {
    let fakeEvent: any;
    let reloadStub: SinonStub;
    let refreshStub: SinonStub;

    beforeEach(() => {
      fakeEvent = { message: '', nick: 'nick', reply: sandbox.stub() };
      reloadStub = sandbox.stub(Reloader, 'reloadShowsAndGroups');
      refreshStub = sandbox.stub(Reloader, 'refreshSources');
    });

    it('Does nothing with no matching message', () => {
      fakeEvent.message = 'thisisnotamatchingmessage';
      IRCControl.handle(fakeEvent);
      assert.notCalled(reloadStub);
      assert.notCalled(refreshStub);
      assert.notCalled(fakeEvent.reply);
    });

    it('Reloads shows.json and replies om !reload', () => {
      fakeEvent.message = '!reload';
      IRCControl.handle(fakeEvent);
      assert.calledOnce(reloadStub);
      assert.calledOnce(fakeEvent.reply);
    });

    it('Refreshes sources and replies om !fetch', () => {
      fakeEvent.message = '!fetch';
      IRCControl.handle(fakeEvent);
      assert.calledOnce(refreshStub);
      assert.calledOnce(fakeEvent.reply);
    });
  });
});
