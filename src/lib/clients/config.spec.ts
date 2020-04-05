import { SinonSandbox, createSandbox } from 'sinon';
import { expect } from 'chai';
import { Config } from './config';
import mock from 'mock-fs';

describe('config', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    Config.configCache = undefined;
    mock({ 'config.json': '{"some":"data"}' });
    sandbox = createSandbox();
  });

  afterEach(() => {
    mock.restore();
    sandbox.restore();
  });

  describe('getConfig', () => {
    it('gets config from config.json', () => {
      expect(Config.getConfig()).to.deep.equal({ some: 'data' });
    });

    it('uses cached config and only reads from disk once', () => {
      expect(Config.getConfig()).to.deep.equal({ some: 'data' });
      mock({ 'config.json': '{"new":"data"}' });
      expect(Config.getConfig()).to.deep.equal({ some: 'data' });
    });
  });

  describe('reloadConfig', () => {
    it('will reload/cache new data from disk for getConfig', () => {
      mock({ 'config.json': '{"new":"data"}' });
      Config.reloadConfig();
      expect(Config.getConfig()).to.deep.equal({ new: 'data' });
    });
  });
});
