import { SinonSandbox, createSandbox, assert, SinonStub, useFakeTimers } from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { EventEmitter } from 'events';
import { IRCNetwork } from './ircNetwork';

describe('IRCNetwork', () => {
  let sandbox: SinonSandbox;
  let fakeIRCClient: any;
  let patchedIRCNetwork: any;

  beforeEach(() => {
    sandbox = createSandbox();
    fakeIRCClient = new EventEmitter();
    fakeIRCClient.quit = sandbox.stub();
    fakeIRCClient.connect = sandbox.stub();
    fakeIRCClient.say = sandbox.stub();
    fakeIRCClient.join = sandbox.stub();
    patchedIRCNetwork = proxyquire('./ircNetwork', {
      'irc-framework': { Client: sandbox.stub().returns(fakeIRCClient) },
    }).IRCNetwork;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('sets expected parameters from input', () => {
      const network = new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      expect(network.name).to.equal('name');
      expect(network.connectOptions).to.deep.equal({
        host: 'host',
        port: 1234,
        nick: 'nick',
        username: 'nick',
        gecos: 'nick',
        ssl: false,
        rejectUnauthorized: true,
      });
      expect(network.bot).to.equal(fakeIRCClient);
    });

    it('calls connect on irc client', () => {
      new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      assert.calledOnce(fakeIRCClient.connect);
    });
  });

  describe('listeners', () => {
    it('does not error on nick in use', (done) => {
      new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      fakeIRCClient.emit('nick in use');
      setTimeout(() => done(), 1);
    });

    it('sets registered to false on close', (done) => {
      const network = new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      network.registered = true;
      fakeIRCClient.emit('close');
      setTimeout(() => {
        expect(network.registered).to.be.false;
        done();
      }, 1);
    });

    it('calls postConnect on registered', (done) => {
      const network = new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      const postConnectStub = sandbox.stub(network, 'postConnect');
      fakeIRCClient.emit('registered');
      setTimeout(() => {
        assert.calledOnce(postConnectStub);
        done();
      }, 1);
    });
  });

  describe('postConnect', () => {
    let network: IRCNetwork;

    beforeEach(() => {
      network = new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      network.registered = false;
      network.joinedChannels = [];
    });

    it('sets registered to true when no nickserv password defined', async () => {
      await network.postConnect();
      expect(network.registered).to.be.true;
    });

    it('sets registered to true after validating nickserv identification if nickserv password defined', (done) => {
      network.nickservPassword = 'pass';
      network.postConnect();
      fakeIRCClient.emit('notice', { nick: 'NickServ', message: 'password accepted' });
      setTimeout(() => {
        assert.calledOnceWithExactly(fakeIRCClient.say, 'NickServ', 'IDENTIFY pass');
        expect(network.registered).to.be.true;
        done();
      }, 1);
    });

    it('does not set registered to true if nickserv doesnt respond with successful notice', (done) => {
      network.nickservPassword = 'pass';
      network.postConnect();
      fakeIRCClient.emit('notice', { nick: 'NickServ', message: 'password denied' });
      setTimeout(() => {
        assert.calledOnceWithExactly(fakeIRCClient.say, 'NickServ', 'IDENTIFY pass');
        expect(network.registered).to.be.false;
        done();
      }, 1);
    });

    it('attempts to join previous channels if they exist', async () => {
      const joinStub = sandbox.stub(network, 'joinRoom');
      network.joinedChannels = ['chan'];
      await network.postConnect();
      assert.calledOnceWithExactly(joinStub, 'chan');
    });

    it('does not throw if rejoining channel fails', async () => {
      const joinStub = sandbox.stub(network, 'joinRoom').throws('broken');
      network.joinedChannels = ['chan'];
      await network.postConnect();
      assert.calledOnceWithExactly(joinStub, 'chan');
    });
  });

  describe('waitUntilRegistered', () => {
    it('returns if network is registered', async () => {
      const network = new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      network.registered = true;
      await network.waitUntilRegistered();
    });
  });

  describe('joinRoom', () => {
    let network: IRCNetwork;
    let clock: any;

    beforeEach(() => {
      network = new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      network.registered = true;
      network.shuttingDown = false;
    });

    afterEach(() => {
      if (clock) clock.restore();
    });

    it('does nothing if channel is already in joinedChannels list', async () => {
      network.joinedChannels = ['chan'];
      await network.joinRoom('chan');
      assert.notCalled(fakeIRCClient.join);
    });

    it('resolves and adds chan to join list if userlist event for channnel is receieved', (done) => {
      network.joinRoom('chan').then(() => {
        expect(network.joinedChannels).to.deep.equal(['chan']);
        done();
      });
      fakeIRCClient.emit('userlist', { channel: 'chan' });
    });

    it('throws error if joining room times out', (done) => {
      clock = useFakeTimers({ shouldAdvanceTime: true });
      network.joinRoom('chan').catch((err) => {
        expect(String(err)).to.equal('Error: Unable to join IRC channel chan on name');
        done();
      });
      clock.tick(6000);
    });
  });

  describe('message', () => {
    let network: IRCNetwork;

    beforeEach(() => {
      network = new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      network.registered = true;
      network.shuttingDown = false;
    });

    it('calls irc client say with expected params', () => {
      network.message('chan', 'message');
      assert.calledOnceWithExactly(fakeIRCClient.say, 'chan', 'message');
    });

    it('calls irc client say once for each line in message', () => {
      network.message('chan', 'message\nwith\nlines');
      assert.calledThrice(fakeIRCClient.say);
      assert.calledWithExactly(fakeIRCClient.say.getCall(0), 'chan', 'message');
      assert.calledWithExactly(fakeIRCClient.say.getCall(1), 'chan', 'with');
      assert.calledWithExactly(fakeIRCClient.say.getCall(2), 'chan', 'lines');
    });
  });

  describe('addChannelWatcher', () => {
    let network: IRCNetwork;
    let joinStub: SinonStub;

    beforeEach(() => {
      network = new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      joinStub = sandbox.stub(network, 'joinRoom');
    });

    it('attempts to join channel provided', async () => {
      await network.addChannelWatcher('chan', () => {});
      assert.calledOnceWithExactly(joinStub, 'chan');
    });

    it('sets up listener on irc client', async () => {
      fakeIRCClient.on = sandbox.stub();
      await network.addChannelWatcher('chan', () => {});
      assert.calledOnce(fakeIRCClient.on);
      expect(fakeIRCClient.on.getCall(0).args[0]).to.equal('privmsg');
    });

    it('calls provided callback when matching message for channel is emitted', (done) => {
      network
        .addChannelWatcher('chan', () => {
          done();
        })
        .then(() => {
          fakeIRCClient.emit('privmsg', { target: 'chan', message: 'msg' });
        });
    });
  });

  describe('disconnect', () => {
    it('sets appropriate parameters and calls irc client quit', () => {
      const network = new patchedIRCNetwork('name', { host: 'host', port: 1234, nick: 'nick' });
      fakeIRCClient.quit = sandbox.stub(); // reset stub because it calls quit on creation once
      network.disconnect();
      assert.calledOnce(fakeIRCClient.quit);
      expect(network.shuttingDown).to.be.true;
      expect(network.registered).to.be.false;
    });
  });
});
