import { SinonSandbox, createSandbox, assert, SinonStub, useFakeTimers } from 'sinon';
import { expect } from 'chai';

import { Parser } from '../../parser.js';
import { IRCManager } from '../../clients/irc/manager.js';
import { IRCSource } from './irc.js';

describe('IRCSource', () => {
  let sandbox: SinonSandbox;
  let hasNetworkStub: SinonStub;
  let addChanelStub: SinonStub;

  beforeEach(() => {
    sandbox = createSandbox();
    hasNetworkStub = sandbox.stub(IRCManager, 'hasNetwork').returns(true);
    addChanelStub = sandbox.stub(IRCManager, 'addChannelWatcher').resolves('listenerClose' as any);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('Assigns provided parameters correctly', () => {
      const ircSource = new IRCSource({} as any, 'http', {
        network: 'network',
        channels: ['channel'],
        nicks: ['NICK'],
        matchers: [['match (.+\\.mkv) (.+)', 'file', 'link']],
      });
      expect(ircSource.network).to.equal('network');
      expect(ircSource.nicks).to.deep.equal(['nick']);
      expect(ircSource.matchers[0].matchNames).to.deep.equal(['file', 'link']);
    });

    it('Checks if network exists', () => {
      new IRCSource({} as any, 'http', {
        network: 'network',
        channels: ['channel'],
        nicks: ['NICK'],
        matchers: [['match (.+\\.mkv) (.+)', 'file', 'link']],
      });
      assert.calledOnceWithExactly(hasNetworkStub, 'network');
    });

    it('Throws if network does not exist', () => {
      hasNetworkStub.returns(false);
      try {
        new IRCSource({} as any, 'http', {
          network: 'network',
          channels: ['channel'],
          nicks: ['NICK'],
          matchers: [['match (.+\\.mkv) (.+)', 'file', 'link']],
        });
      } catch {
        return;
      }
      expect.fail('Did not throw');
    });

    it('Adds a channel watcher and saves listener closer for provided channel', (done) => {
      const ircSource = new IRCSource({} as any, 'http', {
        network: 'network',
        channels: ['channel'],
        nicks: ['NICK'],
        matchers: [['match (.+\\.mkv) (.+)', 'file', 'link']],
      });
      // to allow awaited initialize call to resolve
      setTimeout(() => {
        assert.calledOnce(addChanelStub);
        expect(ircSource.listenerClosers).to.deep.equal(['listenerClose']);
        done();
      }, 5);
    });
  });

  describe('messageCallback', () => {
    let ircSource: IRCSource;
    let parseEpisodeStub: SinonStub;
    let clock: any;

    beforeEach(() => {
      parseEpisodeStub = sandbox.stub(Parser, 'parseWantedEpisode');
      ircSource = new IRCSource({} as any, 'http', {
        network: 'network',
        channels: ['channel'],
        nicks: ['NICK'],
        matchers: [['match (.+\\.mkv) (.+)', 'file', 'link']],
      });
    });

    afterEach(() => {
      if (clock) clock.restore();
    });

    it('Does nothing if nick is not matching', async () => {
      ircSource.multiLine = 2;
      await ircSource.messageCallback({ nick: 'notmatch', target: 'target', message: 'match thing.mkv link' } as any);
      assert.notCalled(parseEpisodeStub);
      expect(ircSource.msgCache).to.deep.equal({});
    });

    it('Adds message to new cache if multiline', async () => {
      const fakeTime = new Date(1234);
      clock = useFakeTimers({ now: fakeTime, toFake: ['Date'] });
      ircSource.multiLine = 2;
      await ircSource.messageCallback({ nick: 'nick', target: 'target', message: 'match thing.mkv link' } as any);
      expect(ircSource.msgCache).to.deep.equal({ 'target|nick': { lastUpdated: fakeTime, messages: ['match thing.mkv link'] } });
    });

    it('Adds message to existing cache if multiline', async () => {
      const fakeTime = new Date(1234);
      clock = useFakeTimers({ now: fakeTime, toFake: ['Date'] });
      ircSource.multiLine = 3;
      ircSource.msgCache = { 'target|nick': { lastUpdated: fakeTime, messages: ['one'] } } as any;
      await ircSource.messageCallback({ nick: 'nick', target: 'target', message: 'match thing.mkv link' } as any);
      expect(ircSource.msgCache).to.deep.equal({ 'target|nick': { lastUpdated: fakeTime, messages: ['one', 'match thing.mkv link'] } });
    });

    it('Parses episode for matching episode', async () => {
      await ircSource.messageCallback({ nick: 'nick', target: 'target', message: 'match thing.mkv link' } as any);
      assert.calledOnceWithExactly(parseEpisodeStub, 'thing.mkv', { url: 'link' }, ircSource);
    });

    it('Starts fetch on matched episode', async () => {
      const fetchStub = sandbox.stub();
      parseEpisodeStub.returns({ fetchEpisode: fetchStub });
      await ircSource.messageCallback({ nick: 'nick', target: 'target', message: 'match thing.mkv link' } as any);
      assert.calledOnce(fetchStub);
    });

    it('Does not throw on unexpected error', async () => {
      ircSource.nicks = { includes: sandbox.stub().throws(new Error('Some error message')) } as any;
      await ircSource.messageCallback({ nick: 'nick', target: 'target', message: 'match thing.mkv link' } as any);
      assert.calledOnce(ircSource.nicks.includes as any);
    });
  });

  describe('close', () => {
    let ircSource: IRCSource;

    beforeEach(() => {
      ircSource = new IRCSource({} as any, 'http', {
        network: 'network',
        channels: ['channel'],
        nicks: ['NICK'],
        matchers: [['match (.+\\.mkv) (.+)', 'file', 'link']],
      });
    });

    it('Calls each function in the listener closers', () => {
      const close1 = sandbox.stub();
      const close2 = sandbox.stub();
      ircSource.listenerClosers = [close1, close2];
      ircSource.close();
      assert.calledOnce(close1);
      assert.calledOnce(close2);
    });
  });
});
