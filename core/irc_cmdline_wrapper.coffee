{EventEmitter} = require 'events'

class exports.IRCCmdlineWrapper extends EventEmitter
  constructor: (@network, @channel, prefix) ->
    @network.join([@channel])
    @channel = @channel.toLowerCase()
    regex = new RegExp("^\\s*#{prefix} (.*)", 'i')

    @network.on 'message', (from, to, msg) =>
      if to.toLowerCase() == @channel && matches = msg.match(regex)
        @emit('input', matches[1])

  output: (line) =>
    @network.say(@channel, line)

