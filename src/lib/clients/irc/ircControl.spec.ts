import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { Reloader } from '../../reloader';
import * as ircControl from './ircControl';

describe('IRCControl', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('handleControlMessage', () => {
    let fakeEvent: any;
    let reloadStub: SinonStub;
    let refreshStub: SinonStub;

    beforeEach(() => {
      fakeEvent = { message: '', nick: 'nick', reply: sandbox.stub() };
      reloadStub = sandbox.stub(Reloader, 'reloadShowsAndGroups');
      refreshStub = sandbox.stub(Reloader, 'refreshSources');
    });

    it('does nothing with no matching message', () => {
      fakeEvent.message = 'thisisnotamatchingmessage';
      ircControl.handleControlMessage(fakeEvent);
      assert.notCalled(reloadStub);
      assert.notCalled(refreshStub);
      assert.notCalled(fakeEvent.reply);
    });

    it('reloads shows.json and replies if !reload', () => {
      fakeEvent.message = '!reload';
      ircControl.handleControlMessage(fakeEvent);
      assert.calledOnce(reloadStub);
      assert.calledOnce(fakeEvent.reply);
    });

    it('refreshes sources and replies if !fetch', () => {
      fakeEvent.message = '!fetch';
      ircControl.handleControlMessage(fakeEvent);
      assert.calledOnce(refreshStub);
      assert.calledOnce(fakeEvent.reply);
    });
  });
});
