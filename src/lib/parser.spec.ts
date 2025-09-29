import { SinonSandbox, createSandbox, assert } from 'sinon';
import { expect } from 'chai';

import { Parser } from './parser.js';

describe('Parser', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('parseWantedEpisode', () => {
    let fakeShow: any;
    let fakeSource: any;
    const fakeFetchOptions: any = 'fetchOptions';
    const validTitle = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv';

    beforeEach(() => {
      Parser.clearUnpasableCache();
      fakeShow = {
        name: 'showName',
        groupID: 'groupID',
        wantedResolutions: { includes: () => true }, // Fake accepting all resolutions for testing
        releasers: {
          groupKey: {
            media: 'releaserMedia',
            subbing: 'releaserSubbing',
          },
        },
      };
      fakeSource = {
        fetchType: 'fetchType',
        defaults: {},
        group: {
          findShow: sandbox.stub().returns(fakeShow),
          key: 'groupKey',
          name: 'groupName',
        },
      };
    });

    it('Assigns fetchOptions to parsed episode', () => {
      const episode = Parser.parseWantedEpisode(validTitle, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${validTitle} did not parse properly`);
      expect(episode.fetchOptions).to.equal('fetchOptions');
    });

    it('Assigns options from provided source', () => {
      const episode = Parser.parseWantedEpisode(validTitle, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${validTitle} did not parse properly`);
      expect(episode.showName).to.equal(fakeShow.name);
      expect(episode.groupID).to.equal(fakeShow.groupID);
      expect(episode.media).to.equal(fakeShow.releasers.groupKey.media);
      expect(episode.subbing).to.equal(fakeShow.releasers.groupKey.subbing);
      expect(episode.groupName).to.equal(fakeSource.group.name);
      expect(episode.fetchType).to.equal(fakeSource.fetchType);
    });

    it('Correctly parses titles into episodes with expected values', () => {
      // covers single and 2-digit episodes and rest of metadata
      let titles = [
        '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv',
        '[TerribleSubs]_Some_アニメ_-_01_[BD720p][123A4BC5].mkv',
        '[TerribleSubs]_Some_アニメ_-_EP01_[720p][123A4BC5].mkv',
        'Some アニメ S02E01 [720p][123A4BC5].mkv',
        'Some アニメ - S02E01 - 720p WEB H.264 (123A4BC5) -SomeOne.mkv',
        'Some アニメ Ep01 (720p) (123A4BC5).mkv',
        'Some アニメ Episode 1 (720p AAC) (123A4BC5).mkv',
        'Some_アニメ_720p_-_Ep01_-_The Name of the Episode_(123A4BC5).mkv',
        '(DVDアニメ) Some_アニメ 第01話 「のののののの」[23m37s 720p XviD 123A4BC5 MP3 48KHz 128Kbps].mkv',
        '[SomeOne] Some アニメ (123A4BC5) 01 [BD 1280x720 x264 AAC].mkv',
        '[SomeOne]Someアニメ.EP01(BD.720p.FLAC)[123A4BC5].mkv',
        '[SomeOne].Some.アニメ.-.01.(BD.720p.FLAC).[123A4BC5].mkv',
        '[SomeOne]_Some_アニメ-_01_[h264-720p][123A4BC5].mkv',
        '[SomeOne]_Some_アニメ-_01_[720p_Hi10P_AAC][123A4BC5].mkv',
        '[SomeOne]_Some_アニメ_-_01_[720p_x264]_[10bit]_[123A4BC5].mkv',
        '[Broken-Stuff] Pocket Bugs (2019) 001 (720p) [123A4BC5].mkv',
      ];
      titles.forEach((title) => {
        const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
        if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
        expect(episode.episode).to.equal(1);
        expect(episode.version).to.equal(1);
        expect(episode.resolution).to.equal('720p');
        expect(episode.crc).to.equal('123A4BC5');
      });

      // covers 3-digit episodes
      titles = ['Some アニメ Episode 100 (720p AAC) (123A4BC5).mkv', '[TerribleSubs] Some アニメ - 100 [720p][123A4BC5].mkv'];
      titles.forEach((title) => {
        const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
        if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
        expect(episode.episode).to.equal(100);
      });

      // covers 4-digit episodes
      titles = ['Some アニメ Episode 1000 (720p AAC) (123A4BC5).mkv', '[TerribleSubs] Some アニメ - 1000 [720p][123A4BC5].mkv'];
      titles.forEach((title) => {
        const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
        if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
        expect(episode.episode).to.equal(1000);
      });
    });

    it('Should use the last possible match for the episode', () => {
      const titles = ['[TerribleSubs] Some 99 Thing - 10 [720p][123A4BC5].mkv', 'Some 99 Things Episode 10 (720p) (123A4BC5).mkv'];
      titles.forEach((title) => {
        const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
        if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
        expect(episode.episode).to.equal(10);
      });
    });

    it('Should not parse with multi-episode', () => {
      const titles = [
        '[TerribleSubs] Some アニメ - 01-12 [720p][123A4BC5].mkv',
        '[Broken-Stuff] Pocket Bugs (2019) 001-012 (1080p)',
        '[Broken-Stuff] Pocket Bugs [2019] 001-012 [720p] (123A4BC5)',
      ];
      titles.forEach((title) => {
        const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
        expect(episode).to.be.undefined;
      });
    });

    it('Should parse the version if it exists and is within range', function () {
      let title = '[TerribleSubs] Some アニメ - 01v2 [720p].mkv';
      let episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.version).to.equal(2);

      title = '[TerribleSubs] Some アニメ - 01v02 [720p].mkv'; // leading 0 in the version
      episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.version).to.equal(2);

      title = '[TerribleSubs] Some アニメ - 01v0 [720p].mkv'; // 0 is in range
      episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.version).to.equal(0);

      title = '[TerribleSubs] Some アニメ - 01v-1 [720p].mkv'; // negative number should be an error
      episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('Should detect a bunch of valid resolutions', () => {
      const titles = {
        'Some アニメ - 01 720p.mkv': '720p',
        'Some アニメ - 01 [1080p].mkv': '1080p',
        'Some アニメ - 01 BD480p.mkv': '848x480',
        'Some アニメ - 01 (640x480).mkv': '640x480',
        'Some アニメ - 01 720x480  .mkv': '720x480',
        'Some アニメ - 01 (704x396).mkv': '704x396',
        'Some アニメ - 01 (540p).mkv': '960x540',
      };

      Object.entries(titles).forEach(([title, expectedRes]) => {
        const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
        if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
        expect(episode.resolution).to.equal(expectedRes);
      });
    });

    it('Should parse the CRC if it exists', () => {
      let title = '[TerribleSubs] Some アニメ - 01 [720p].mkv';
      let episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.crc).to.be.undefined;

      title = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv';
      episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.crc).to.equal('123A4BC5');

      title = '[TerribleSubs] Some アニメ - 01 [720p][123a4bc5].mkv'; // lowercase
      episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.crc).to.equal('123A4BC5');
    });

    it('Should use the last possible match for the CRC', () => {
      const title = '[TerribleSubs] Some アニメ [12345678] - 01 [720p][123A4BC5].mkv';
      const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.crc).to.equal('123A4BC5');
    });

    it('Should not match inconsistently formatted CRCs', () => {
      const title = '[TerribleSubs] Some アニメ - 01 [720p][AbcdaBcd].mkv';
      const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.crc).to.be.undefined;
    });

    it('Should not match CRCs at the start of the title', () => {
      const title = '[12345678] Some アニメ - 01 [720p].mkv';
      const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.crc).to.be.undefined;
    });

    it('Should not parse if it cannot find a matching show', () => {
      fakeSource.group.findShow.returns(undefined);
      const episode = Parser.parseWantedEpisode(validTitle, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('Should use default resolution from source if not found in title', () => {
      fakeSource.defaults.res = '1080p';
      const title = '[TerribleSubs] Some アニメ - 01 [123A4BC5].mkv';
      const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      if (!episode) expect.fail(`Episode for ${title} did not parse properly`);
      expect(episode.resolution).to.equal('1080p');
    });

    it('Should not parse if resolution is not wanted on the show', () => {
      fakeShow.wantedResolutions = ['1080p'];
      const title = '[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv';
      const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('Should not parse if resolution is not known', () => {
      const title = '[TerribleSubs] Some アニメ - 01 [100x100][123A4BC5].mkv';
      const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('Should not parse with no resolution', () => {
      const title = '[TerribleSubs] Some アニメ - 01 [123A4BC5].mkv';
      const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('Should not parse with invalid episode', () => {
      const title = '[TerribleSubs] Some アニメ - 0v1 [720p][123A4BC5].mkv';
      const episode = Parser.parseWantedEpisode(title, fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('Should not parse with empty title', () => {
      const episode = Parser.parseWantedEpisode('', fakeFetchOptions, fakeSource);
      expect(episode).to.be.undefined;
    });

    it('Should use unparseableCache to return early if parsing known bad title', () => {
      Parser.parseWantedEpisode('bad', fakeFetchOptions, fakeSource);
      Parser.parseWantedEpisode('bad', fakeFetchOptions, fakeSource);
      // ensure this was only called once, even though we called function twice with same inputs
      assert.calledOnce(fakeSource.group.findShow);
    });
  });
});
