import { SinonSandbox, createSandbox, assert } from 'sinon';
import { expect } from 'chai';
import { Source } from './source';

describe('Source', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
    Source.registered = {};
    Source.activeSources = [];
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('registerSourceType', () => {
    it('adds a static source type', () => {
      Source.registerSourceType('thing', 'something');
      expect(Source.registered.thing).to.equal('something');
    });
  });

  describe('createSource', () => {
    it('throws an error when trying to create an invalid type', () => {
      try {
        Source.createSource('badtype', {} as any, 'type', {});
      } catch (e) {
        return;
      }
      expect.fail('did not throw');
    });

    it('uses registered static fetcher', () => {
      Source.registered.test = sandbox.stub();
      Source.createSource('test', {} as any, 'abc', {});
      assert.calledOnceWithExactly(Source.registered.test, {}, 'abc', {});
    });

    it('adds successfully created source to static list', () => {
      Source.registered.test = sandbox.stub();
      const source = Source.createSource('test', {} as any, 'abc', {});
      expect(Source.activeSources).includes(source);
    });
  });

  describe('removeAllSources', () => {
    it('calls close on current sources', async () => {
      const fakeSource = { close: sandbox.stub() } as any;
      Source.activeSources = [fakeSource];
      await Source.removeAllSources();
      assert.calledOnce(fakeSource.close);
    });
  });

  describe('getFetcherOptions', () => {
    it('returns valid fetcher options for torrent type', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const source = new Source('type', 'torrent');
      expect(source.getFetcherOptions('thing')).to.deep.equal({ uri: 'thing' });
    });

    it('returns valid fetcher options for http type', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const source = new Source('type', 'http');
      expect(source.getFetcherOptions('thing')).to.deep.equal({ url: 'thing' });
    });

    it('throws an error if fetcher type is not handled', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const source = new Source('type', 'unhandled');
      try {
        source.getFetcherOptions('thing');
      } catch (e) {
        return;
      }
      expect.fail('did not throw');
    });
  });
});
