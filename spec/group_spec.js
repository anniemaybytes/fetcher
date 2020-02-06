Group = require('../core/group').Group;
Show = require('../core/show').Show;

describe('Group', function() {
  return; // needs work
  var group1, group2;
  var shows = [
    new Show("Some アニメ", {
      id: 404,
      releasers: {"terrible": "\\[TerribleSubs\\] Some アニメ"}
    })
  ];

  beforeEach(function() {
    group1 = new Group("terrible", {
      "name": "TerribleSubs",
      "sources": [
        {"rss+http": {"url": "http://url1.rss"}},
        {"rss+http": {"url": "http://url2.rss"}}
      ]
    });
    group1.shows = shows;

    group2 = new Group("terrible", {
      "name": "TerribleSubs",
      "sources": [
        {"irc+xdcc": {
          "network": "network",
          "channels": ["#channel"],
          "nicks": ["a", "b", "c"],
          "matchers": [
            ["From .* \\* \\[\\w+\\] \\* (.+\\.mkv) \\* \\/msg .* xdcc send (\\d+)", "file", "id"],
            ["(\\d+) - (.*\\.mkv)", "id", "file"]
          ]
        }}
      ]
    });
    group2.shows = shows;
  });

  describe("findShow", function() {
    it("should return undefined if there is no matching show", function() {
      expect(group1.findShow("not a filename")).toBeUndefined();
      expect(group2.findShow("not a filename")).toBeUndefined();
    });

    it("should return the correct show if one matches", function() {
      expect(group1.findShow("[TerribleSubs] Some アニメ - 01.mkv")).toBe(shows[0]);
      expect(group2.findShow("[TerribleSubs] Some アニメ - 01.mkv")).toBe(shows[0]);
    });
  });

  describe("IRCFeed", function() {
    var feed;

    beforeEach(function() {
      feed = group2.feeds[0];
    });

    describe("match", function() {
      it("should return undefined if there is no match", function() {
        expect(feed.match("unmatched")).toBeUndefined();
      });

      it("should return the correct mapping if there is a match", function() {
        expect(feed.match(
          "From Somewhere * [100MB] * [TerribleSubs] Some アニメ - 01.mkv * /MSG a XDCC SEND 123"
        )).toEqual({
          id: '123',
          file: '[TerribleSubs] Some アニメ - 01.mkv'
        });

        expect(feed.match(
          "123 - [TerribleSubs] Some アニメ - 01.mkv"
        )).toEqual({
          id: '123',
          file: '[TerribleSubs] Some アニメ - 01.mkv'
        });
      });
    });

    describe("inChannel", function() {
      it("returns true if this group is in the channel", function() {
        expect(feed.inChannel('#channel')).toBe(true);
      });

      it("returns false if this group is not in the channel", function() {
        expect(feed.inChannel('#not-channel')).toBe(false);
      });
    });
  });
});
