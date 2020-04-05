import { SinonSandbox, createSandbox, assert, SinonStub } from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { Config } from './config';
import { LevelDB } from './leveldb';
import { EventEmitter } from 'events';

describe('leveldb', () => {
  let sandbox: SinonSandbox;
  let mockDB: any;

  beforeEach(() => {
    sandbox = createSandbox();
    const emitter = new EventEmitter();
    mockDB = {
      get: sandbox.stub(),
      put: sandbox.stub(),
      del: sandbox.stub(),
      close: sandbox.stub(),
      createValueStream: sandbox.stub().returns(emitter),
    };
    LevelDB.db = mockDB;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('initialize', () => {
    let mockLevel: SinonStub;
    let initialize: any;

    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({} as any);
      mockLevel = sandbox.stub();
      initialize = proxyquire('./leveldb', {
        level: mockLevel,
      }).LevelDB.initialize;
    });

    it('calls level to initialize db with expected params', async () => {
      await initialize();
      assert.calledOnceWithExactly(mockLevel, 'state.ldb', { valueEncoding: 'json' });
    });
  });

  describe('get', () => {
    it('calls get with the correct provided params', async () => {
      await LevelDB.get('thing');
      assert.calledWithExactly(mockDB.get, 'thing');
    });

    it('returns the get call of the db', async () => {
      mockDB.get.resolves('data');
      expect(await LevelDB.get('thing')).to.equal('data');
    });
  });

  describe('put', () => {
    it('calls put with the correct provided params', async () => {
      await LevelDB.put('key', 'thing');
      assert.calledWithExactly(mockDB.put, 'key', 'thing');
    });

    it('returns the put call of the db', async () => {
      mockDB.put.resolves('data');
      expect(await LevelDB.put('key', 'thing')).to.equal('data');
    });
  });

  describe('delete', () => {
    it('calls del with the correct provided params', async () => {
      await LevelDB.delete('key');
      assert.calledWithExactly(mockDB.del, 'key');
    });

    it('returns the del call of the db', async () => {
      mockDB.del.resolves('data');
      expect(await LevelDB.delete('key')).to.equal('data');
    });
  });

  describe('list', () => {
    let listEventEmitter: EventEmitter;

    beforeEach(() => {
      listEventEmitter = mockDB.createValueStream();
    });

    it('returns array of data evens from db', async () => {
      const promise = LevelDB.list();
      listEventEmitter.emit('data', 'thing1');
      listEventEmitter.emit('data', 'thing2');
      listEventEmitter.emit('end');
      expect(await promise).to.deep.equal(['thing1', 'thing2']);
    });

    it('throws exception on error', async () => {
      const promise = LevelDB.list();
      listEventEmitter.emit('error', 'someError');
      try {
        await promise;
        expect.fail('did not throw');
      } catch (e) {
        expect(e).to.equal('someError');
      }
    });
  });

  describe('shutdown', () => {
    it('calls close on the db', async () => {
      await LevelDB.shutdown();
      assert.calledOnce(mockDB.close);
    });
  });
});
