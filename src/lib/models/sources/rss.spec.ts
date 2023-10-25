import { SinonSandbox, createSandbox, assert, SinonStub } from 'sinon';
import { expect } from 'chai';

import { Parser } from '../../parser.js';
import { RSSSource } from './rss.js';

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
      parseEpisode = sandbox.stub(Parser, 'parseWantedEpisode');

      fakeParser = { parseURL: sandbox.stub() };
      sandbox.stub(RSSSource, 'parser').returns(fakeParser);

      const rssParser = new RSSSource({} as any, 'http', { url: 'url' });
      fetch = rssParser.fetch.bind(rssParser);
    });

    it('Calls parser with correct URL', async () => {
      await fetch();
      assert.calledOnceWithExactly(fakeParser.parseURL, 'url');
    });

    it('Parses item from RSS feed', async () => {
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

    it('Parses enclosure item from RSS feed', async () => {
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
      fakeParser.parseURL.throws(new Error('Some error message'));
      await fetch();
    });
  });
});
