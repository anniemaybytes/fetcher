_ = require 'underscore'

class exports.Group
  constructor: (key, options) ->
    @key = key
    @shows = {}
    @name = options.name

    @sources = for source in options.sources
      feeds = Object.keys(source)
      throw new Error("invalid config") if feeds.length != 1

      matches = feeds[0].match(/^(\w+)\+(\w+)$/)
      throw new Error("malformed source " + feeds[0]) if !matches

      feedopts = source[feeds[0]]
      feedopts.meta = _.defaults(feedopts.meta || {}, group: @name)
      {feed: matches[1], fetcher: matches[2], feedopts}

  findShow: (filename) ->
    key = @key
    _.find @shows, (show) -> show.releasers[key].regex.test(filename)

  fetch: ->
    if _.size(@shows)
      feed.fetch() for feed in @feeds
    return
