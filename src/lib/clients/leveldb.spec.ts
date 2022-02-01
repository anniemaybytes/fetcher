import { SinonSandbox, createSandbox, assert, SinonStub } from 'sinon';
import { expect } from 'chai';
import { EventEmitter } from 'events';

import { Config } from './config.js';
import { LevelDB } from './leveldb.js';

describe('LevelDB', () => {
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

    beforeEach(() => {
      sandbox.stub(Config, 'getConfig').returns({} as any);
      mockLevel = sandbox.stub();
    });

    it('Calls LevelDB to initialize database with expected parameters', async () => {
      await LevelDB.initialize(mockLevel);
      assert.calledOnceWithExactly(mockLevel, 'state.ldb', { valueEncoding: 'json' });
    });
  });

  describe('get', () => {
    it('Calls GET with the correct provided parameters', async () => {
      await LevelDB.get('thing');
      assert.calledWithExactly(mockDB.get, 'thing');
    });

    it('Returns the GET call of the database', async () => {
      mockDB.get.resolves('data');
      expect(await LevelDB.get('thing')).to.equal('data');
    });
  });

  describe('put', () => {
    it('Calls PUT with the correct provided parameters', async () => {
      await LevelDB.put('key', 'thing');
      assert.calledWithExactly(mockDB.put, 'key', 'thing');
    });

    it('Returns the PUT call of the database', async () => {
      mockDB.put.resolves('data');
      expect(await LevelDB.put('key', 'thing')).to.equal('data');
    });
  });

  describe('delete', () => {
    it('Calls DEL with the correct provided parameters', async () => {
      await LevelDB.delete('key');
      assert.calledWithExactly(mockDB.del, 'key');
    });

    it('Returns the DEL call of the database', async () => {
      mockDB.del.resolves('data');
      expect(await LevelDB.delete('key')).to.equal('data');
    });
  });

  describe('list', () => {
    let listEventEmitter: EventEmitter;

    beforeEach(() => {
      listEventEmitter = mockDB.createValueStream();
    });

    it('Returns array of data evens from database', async () => {
      const promise = LevelDB.list();
      listEventEmitter.emit('data', 'thing1');
      listEventEmitter.emit('data', 'thing2');
      listEventEmitter.emit('end');
      expect(await promise).to.deep.equal(['thing1', 'thing2']);
    });

    it('Throws exception on error', async () => {
      const promise = LevelDB.list();
      listEventEmitter.emit('error', 'someError');
      try {
        await promise;
      } catch (e) {
        expect(e).to.equal('someError');
        return;
      }
      expect.fail('Did not throw');
    });
  });

  describe('shutDown', () => {
    it('Calls close on the DB', async () => {
      await LevelDB.shutDown();
      assert.calledOnce(mockDB.close);
    });
  });
});
