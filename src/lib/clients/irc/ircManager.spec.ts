import { SinonSandbox, createSandbox, SinonStub, assert, useFakeTimers, match } from 'sinon';
import { expect } from 'chai';
import { Config } from '../config';
import * as ircNetworkModule from './ircNetwork';
import { IRCManager } from './ircManager';

describe('IRCManager', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    IRCManager.networks = {};
    IRCManager.controlNetwork = undefined as any;
    IRCManager.controlChannel = undefined as any;
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('initialize', () => {
    let fakeCreateNetwork: SinonStub;
    let fakeNetwork: any;
    let fakeConfig: any;

    beforeEach(() => {
      fakeNetwork = { waitUntilRegistered: sandbox.stub().resolves(undefined), addChannelWatcher: sandbox.stub(), disconnect: sandbox.stub() };
      fakeCreateNetwork = sandbox.stub(ircNetworkModule, 'IRCNetwork').returns(fakeNetwork);
      fakeConfig = {
        irc_networks: { networkKey: { some: 'options' } },
        irc_control: { network: 'networkKey', channel: 'channel' },
      };
      sandbox.stub(Config, 'getConfig').returns(fakeConfig);
    });

    it('creates network for config networks and waits until they are registered', async () => {
      await IRCManager.initialize();
      assert.calledOnceWithExactly(fakeCreateNetwork, 'networkKey', { some: 'options' });
      assert.calledOnce(fakeNetwork.waitUntilRegistered);
      expect(IRCManager.networks.networkKey).to.equal(fakeNetwork);
    });

    it('assigns static control network and adds channel watcher for control room', async () => {
      await IRCManager.initialize();
      expect(IRCManager.controlNetwork).to.equal(fakeNetwork);
      expect(IRCManager.controlChannel).to.equal('channel');
      assert.calledOnceWithExactly(fakeNetwork.addChannelWatcher, 'channel', match.any);
    });

    it('does not throw if adding channel watcher (joining) control room fails', async () => {
      fakeNetwork.addChannelWatcher.throws('borked');
      await IRCManager.initialize();
    });

    it('does not throw if control network does not exist in network definitions', async () => {
      fakeConfig.irc_control.network = 'badnetwork';
      await IRCManager.initialize();
    });

    it('does not throw if joining a network fails, and disconnects from said network', async () => {
      fakeNetwork.waitUntilRegistered.throws('could not join');
      await IRCManager.initialize();
      expect(IRCManager.networks.networkKey).to.be.undefined;
      assert.calledOnce(fakeNetwork.disconnect);
    });
  });

  describe('hasNetwork', () => {
    it('returns true if network exists', () => {
      IRCManager.networks.thing = 'exists' as any;
      expect(IRCManager.hasNetwork('thing')).to.be.true;
    });

    it('returns false if network does not exist', () => {
      expect(IRCManager.hasNetwork('badnetwork')).to.be.false;
    });
  });

  describe('addChannelWatcher', () => {
    let fakeNetwork: any;

    beforeEach(() => {
      fakeNetwork = { addChannelWatcher: sandbox.stub() };
      IRCManager.networks.networkKey = fakeNetwork;
    });

    it('calls addChannelWatcher on proper irc network', async () => {
      await IRCManager.addChannelWatcher('networkKey', 'chan', 'fakeCallback' as any);
      assert.calledOnceWithExactly(fakeNetwork.addChannelWatcher, 'chan', 'fakeCallback');
    });

    it('throws an error with unknown network key', async () => {
      try {
        await IRCManager.addChannelWatcher('badnetwork', 'chan', 'fakeCallback' as any);
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });
  });

  describe('controlAnnounce', () => {
    let fakeNetwork: any;

    beforeEach(() => {
      fakeNetwork = { message: sandbox.stub() };
      IRCManager.controlNetwork = fakeNetwork;
      IRCManager.controlChannel = 'chan';
    });

    it('calls control network message with correct channel and message', () => {
      IRCManager.controlAnnounce('message');
      assert.calledOnceWithExactly(fakeNetwork.message, 'chan', 'message');
    });

    it('does not throw on error', () => {
      fakeNetwork.message.throws('busted');
      IRCManager.controlAnnounce('message');
    });
  });

  describe('shutdown', () => {
    let clock: any;

    beforeEach(() => {
      clock = useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      clock.restore();
    });

    it('calls disconnect on all current networks', (done) => {
      const fakeNetwork: any = { disconnect: sandbox.stub() };
      IRCManager.networks.fakeNetwork = fakeNetwork;
      IRCManager.shutdown().then(() => {
        assert.calledOnce(fakeNetwork.disconnect);
        done();
      });
      clock.tick(2000);
    });
  });
});
