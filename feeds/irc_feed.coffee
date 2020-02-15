{Feed} = require '../core/feed'
_ = require 'underscore'

irc = require '../irc/irc'

class exports.IRCFeed extends Feed
  @register('irc')

  constructor: (@options) ->
    {@channels, @nicks, network: @networkKey, @multiline} = @options

    @nicks = @nicks.map (n) -> n.toLowerCase()
    @channels = @channels.map (c) -> c.toLowerCase()

    @matchers = @options.matchers.map (matcher) ->
      re: new RegExp(matcher[0], 'i')
      args: matcher.slice(1)

    @network = irc.connect(@networkKey)
    @network.join(@channels)

    messageCache = {}

    @network.on 'message', @messageHandler = (from, to, msg) =>
      fromKey = from.toLowerCase()
      toKey = to.toLowerCase()
      return unless fromKey in @nicks && toKey in @channels

      if @multiline
        lines = (messageCache[fromKey] ?= [])
        lines.shift() if lines.length >= @multiline
        lines.push(msg)
        msg = lines.join('\n')

      if match = @match(msg)
        item = {title: match.file, id: match.id, user: from, network: @networkKey, link: match.link}
        meta = _.defaults({title: match.file}, @options.meta)
        @emit('new', item, meta)

  detach: ->
    @network.removeListener 'message', @messageHandler

  fetch: ->
    undefined

  match: (message) ->
    for {re, args} in @matchers when match = message.match(re)
      return _.object(args, match.slice(1))

  inChannel: (c) ->
    c.toLowerCase() in @channels
