{Fetcher} = require '../core/fetcher'
net = require 'net'
irc = require '../irc/irc'
config = require '../config'
_ = require 'underscore'

uint32ToIP = (n) ->
  byte1 = n & 255
  byte2 = ((n >> 8) & 255)
  byte3 = ((n >> 16) & 255)
  byte4 = ((n >> 24) & 255)

  byte4 + "." + byte3 + "." + byte2 + "." + byte1


parseSendParams = (text) ->
  parts = text.match(/(?:[^\s"]+|"[^"]*")+/g)

  file: parts[2]
  ip: uint32ToIP(parseInt(parts[3], 10))
  port: parseInt(parts[4], 10)
  length: parseInt(parts[5], 10)


class exports.XDCCFetcher extends Fetcher
  @register('xdcc')

  constructor: (@options) ->
    @command = "XDCC SEND #{@options.id}"
    super

  fetch: (stream) ->
    network = irc.connect(@options.network)
    started = false

    ctcphandler = (from, to, msg) =>
      console.log('IRC>> ctcp', from, to, msg) if config.debug
      return if from.toLowerCase() != @options.user.toLowerCase()
      return if msg.substr(0, 9) != 'DCC SEND '

      details = parseSendParams(msg)
      return if details.file != @options.title

      started = true
      detach()
      @startTransfer(stream, details)

    detach = ->
      network.client.removeListener('ctcp-privmsg', ctcphandler)

    timeout = =>
      return if started
      detach()
      network.say(@options.user, 'XDCC CANCEL')
      @emit('error', new Error('timed out'))

    network.client.on('ctcp-privmsg', ctcphandler)
    network.say(@options.user, @command)
    setTimeout(timeout, 10 * 60 * 1000)

  startTransfer: (stream, details) ->
    @started(details.length)

    received = 0
    sendBuffer = new Buffer(4)

    client = net.connect details.port, details.ip, ->
      console.log('connected', details.ip, details.port)

    client.on 'data', (data) =>
      stream.write(data)
      received += data.length
      sendBuffer.writeUInt32BE(received, 0)
      client.write(sendBuffer)
      @progress(data.length)

    client.on 'error', (err) =>
      stream.end()
      @emit('error', err)

    client.on 'end', =>
      stream.end()

    stream.on 'finish', =>
      @finished()
