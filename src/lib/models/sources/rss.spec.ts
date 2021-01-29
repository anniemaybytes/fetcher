import { SinonSandbox, createSandbox, assert, SinonStub } from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import * as episodeParser from '../../episodeParser';
import { RSSSource } from './rss';

describe('RSSSource', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('Assigns provided parameters correctly', () => {
      const rssSource = new RSSSource({} as any, 'fetchType', { url: 'url' });
      expect(rssSource.url).to.equal('url');
    });
  });

  describe('fetch', () => {
    let fetch: any;
    let parseEpisode: SinonStub;
    let fakeParser: any;

    beforeEach(() => {
      fakeParser = { parseURL: sandbox.stub() };
      const patchedModule = proxyquire('./rss', {
        'rss-parser': sandbox.stub().returns(fakeParser),
      });
      const rssParser = new patchedModule.RSSSource('', 'http', { url: 'url' });
      fetch = rssParser.fetch.bind(rssParser);
      parseEpisode = sandbox.stub(episodeParser, 'parseWantedEpisode');
    });

    it('Calls parser with correct url', async () => {
      await fetch();
      assert.calledOnceWithExactly(fakeParser.parseURL, 'url');
    });

    it('parses item from rss feed', async () => {
      fakeParser.parseURL.resolves({
        items: [
          {
            title: 'some title',
            link: 'alink',
          },
        ],
      });
      await fetch();
      assert.calledOnce(parseEpisode);
      expect(parseEpisode.getCall(0).args[0]).to.equal('some title');
      expect(parseEpisode.getCall(0).args[1]).to.deep.equal({ url: 'alink' });
    });

    it('Parses enclosure item from rss feed', async () => {
      fakeParser.parseURL.resolves({
        items: [
          {
            enclosure: {
              url: 'http://some.url/subpath/some%20title',
            },
          },
        ],
      });
      await fetch();
      assert.calledOnce(parseEpisode);
      expect(parseEpisode.getCall(0).args[0]).to.equal('some title');
      expect(parseEpisode.getCall(0).args[1]).to.deep.equal({ url: 'http://some.url/subpath/some%20title' });
    });

    it('Starts fetching parsed episode', async () => {
      fakeParser.parseURL.resolves({
        items: [
          {
            title: 'some title',
            link: 'alink',
          },
        ],
      });
      const fetchEpisode = sandbox.stub();
      parseEpisode.returns({ fetchEpisode });
      await fetch();
      assert.calledOnce(fetchEpisode);
    });

    it('Does not throw on unexpected error', async () => {
      fakeParser.parseURL.throws('broken');
      await fetch();
    });
  });
});
