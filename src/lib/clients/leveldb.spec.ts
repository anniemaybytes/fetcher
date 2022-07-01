import { SinonSandbox, createSandbox, assert, SinonStub } from 'sinon';
import { expect } from 'chai';

import { Config } from './config.js';
import { LevelDB } from './leveldb.js';

describe('LevelDB', () => {
  let sandbox: SinonSandbox;
  let mockDB: any;

  beforeEach(() => {
    sandbox = createSandbox();
    mockDB = {
      get: sandbox.stub(),
      put: sandbox.stub(),
      del: sandbox.stub(),

      values: sandbox.stub().returns({
        all: sandbox.stub(),
      }),

      close: sandbox.stub(),
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
    it('Returns array of data events from database', async () => {
      const values = ['thing1', 'thing2'];
      mockDB.values.returns({ all: sandbox.stub().resolves(values) });
      expect(await LevelDB.list()).to.deep.equal(values);
    });
  });

  describe('shutDown', () => {
    it('Calls close on the DB', async () => {
      await LevelDB.shutDown();
      assert.calledOnce(mockDB.close);
    });
  });
});
