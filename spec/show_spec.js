parseFilename = require('../core/file_meta').parseFilename;

describe('filename handling', function() {
  describe("parseFilename", function() {
    it("should return an object representing the filename", function() {
      var files = [
        "[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv",
        "[TerribleSubs]_Some_アニメ_-_01_[BD720p][123A4BC5].mkv",
        "[TerribleSubs]_Some_アニメ_-_EP01_[720p][123A4BC5].mkv",
        "Some アニメ S02E01 [720p][123A4BC5].mkv",
        "Some アニメ Ep01 (720p) (123A4BC5).mkv",
        "Some_アニメ_720p_-_Ep01_-_The Name of the Episode_(123A4BC5).mkv",
        "(DVDアニメ) Some_アニメ 第01話 「のののののの」[23m37s 720p XviD 123A4BC5 MP3 48KHz 128Kbps].mkv",
        "[SomeOne] Some アニメ (123A4BC5) 01 [BD 1280x720 x264 AAC].mkv",
        "[SomeOne]Someアニメ.EP01(BD.720p.FLAC)[123A4BC5].mkv",
        "[SomeOne]_Some_アニメ-_01_[h264-720p][123A4BC5].mkv",
        "[SomeOne]_Some_アニメ-_01_[720p_Hi10P_AAC][123A4BC5].mkv",
        "[SomeOne]_Some_アニメ_-_01_[720p_x264]_[10bit]_[123A4BC5].mkv"
      ];

      files.forEach(function(file) {
        expect(parseFilename(file)).toEqual({
          //name: 'Some アニメ',
          episode: 1,
          version: 1,
          res: '720p',
          container: 'mkv',
          crc: '123A4BC5'
        });
      });
    });

    it("should parse the version if it exists and is within range", function() {
      var file = "[TerribleSubs] Some アニメ - 01v2 [720p].mkv";
      expect(parseFilename(file).version).toEqual(2);

      file = "[TerribleSubs] Some アニメ - 01v20 [720p].mkv";
      expect(parseFilename(file).version).toEqual(1);
    });

    it("should detect a bunch of resolutions", function() {
      var files = {
        "Some アニメ - 720p.mkv":      '720p',
        "Some アニメ - [1080p].mkv":   '1080p',
        "Some アニメ - BD480p.mkv":    '480p',
        "Some アニメ - (640x480).mkv": '480p',
        "Some アニメ - 720x480  .mkv": '720x480',
        "Some アニメ - (704x396).mkv": '704x396'
      };

      for (var test in files) {
        expect(parseFilename(test).res).toEqual(files[test]);
      }
    });

    it("should parse the CRC if it exists", function() {
      var file = "[TerribleSubs] Some アニメ - 01 [720p].mkv";
      expect(parseFilename(file).crc).toBeUndefined();

      file = "[TerribleSubs] Some アニメ - 01 [720p][123A4BC5].mkv";
      expect(parseFilename(file).crc).toEqual('123A4BC5');

      file = "[TerribleSubs] Some アニメ - 01 [720p][123a4bc5].mkv"; // Lowercase
      expect(parseFilename(file).crc).toEqual('123A4BC5');
    });

    it("should use the last possible match for the CRC", function() {
      var file = "[TerribleSubs] Some アニメ [12345678] - 01 [720p][123A4BC5].mkv";
      expect(parseFilename(file).crc).toEqual('123A4BC5');
    });

    it("should not match inconsistently formatted CRCs", function() {
      var file = "[TerribleSubs] Some アニメ - 01 [720p][Abcdabcd].mkv";
      expect(parseFilename(file).crc).toBeUndefined();
    });

    it("should not match CRCs at the start of the filename", function() {
      var file = "[12345678] Some アニメ - 01 [720p].mkv";
      expect(parseFilename(file).crc).toBeUndefined();
    });

    it("should use the last possible match for the episode", function() {
      var file = "[TerribleSubs] Some 99 Thing - 01 [720p][123A4BC5].mkv";
      expect(parseFilename(file).episode).toEqual(1);
    });

    /*
    it("should be influenced by the releaser for confusing input", function() {
      var file = "[Something] [12345678] Some アニメ - 01 [720p].mkv";
      expect(parseFilename(file, 'something').crc).toBeUndefined();

      file = "[Something] [12345678] Some アニメ - 01 [720p][123A4BC5].mkv";
      expect(parseFilename(file, 'something').crc).toEqual('123A4BC5');
    });
    */
  });
});

