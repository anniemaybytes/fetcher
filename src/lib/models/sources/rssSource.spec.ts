import { SinonSandbox, createSandbox, assert, SinonStub } from 'sinon';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import * as episodeParser from '../../episodeParser';
import { RSSSource } from './rssSource';

describe('RSSSource', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('assigns provided parameters correctly', () => {
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
      const patchedModule = proxyquire('./rssSource', {
        'rss-parser': sandbox.stub().returns(fakeParser),
      });
      const rssParser = new patchedModule.RSSSource('', 'http', { url: 'url' });
      fetch = rssParser.fetch.bind(rssParser);
      parseEpisode = sandbox.stub(episodeParser, 'parseWantedEpisode');
    });

    it('calls parser with correct url', async () => {
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

    it('parses enclosure item from rss feed', async () => {
      fakeParser.parseURL.resolves({
        items: [
          {
            enclosure: {
              url: 'http://some.url/some%20title',
            },
          },
        ],
      });
      await fetch();
      assert.calledOnce(parseEpisode);
      expect(parseEpisode.getCall(0).args[0]).to.equal('some title');
      expect(parseEpisode.getCall(0).args[1]).to.deep.equal({ url: 'http://some.url/some%20title' });
    });

    it('starts fetching parsed episode', async () => {
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

    it('does not throw on unexpected error', async () => {
      fakeParser.parseURL.throws('broken');
      await fetch();
    });
  });
});
