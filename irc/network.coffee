{EventEmitter} = require 'events'
irc = require 'irc'
config = require '../config'
_ = require 'underscore'

strip = (msg) ->
  msg.replace(/[\x0F\x02\x16\x1F\x1D]/g, '')

class exports.IRCNetwork extends EventEmitter
  constructor: (@targetNick, options) ->
    nsPassword = options.nickserv_password
    nsUser = 'NickServ'
    nsCommand = "IDENTIFY #{nsPassword}"

    options = _.defaults(options, {
      userName: @targetNick
      realName: @targetNick + ' ' + @targetNick # rizon needs this...
    })

    options = _.omit(options, 'nick', 'nickserv_password')
    options.stripColors = true
    options.autoConnect = true

    @sendbuf = []
    @channels = []
    @connected = false

    @client = new irc.Client(options.host, @targetNick, options)

    @client.on 'message', (from, to, msg) =>
      @emit('message', from, to, strip(msg))

    @client.on 'notice', (from, to, msg) =>
      if from == nsUser && msg.match(/Password accepted/i)
        @connected = true
        sendJoins()
      @emit('notice', from, to, strip(msg))

    if config.debug
      logfn = (type) -> (from, to, msg) ->
        console.log("IRC>> #{type} (#{from || 'none'} -> #{to}): #{msg}")

      @client.on 'message', logfn('message')
      @client.on 'notice', logfn('notice')
      @client.on 'ctcp-privmsg', logfn('ctcp-privmsg')

    @client.on 'connect', =>
      @client.conn.on 'close', =>
        @connected = false

    sendJoins = =>
      @channels = _.uniq(@channels)
      for channel in @channels
        @client.send('JOIN', channel)
      return

    identify = =>
      @client.say(nsUser, nsCommand)

    @client.on 'motd', =>
      if nsPassword
        identify()
      else
        @connected = true
        sendJoins()
      return

    @client.on 'join', =>
      @connected = true
      sb = @sendbuf
      @sendbuf = []
      fn() for fn in sb
      return

    @client.on 'error', (msg) =>
      console.log('error (irc):', msg)

  disconnect: ->
    @client.disconnect('gracefully')

  join: (channels) ->
    if @connected
      @client.send('JOIN', c) for c in channels
    else
      @channels.push(c) for c in channels
    return

  send: (fn) ->
    if @connected
      fn()
    else
      @sendbuf.push(fn)
    return

  say: (to, msg) ->
    @send => @client.say(to, msg)

  nick: ->
    @client.nick || @targetNick
