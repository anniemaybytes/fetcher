{EventEmitter} = require 'events'
{IRCNetwork} = require './network'

class IRCManager extends EventEmitter
  networks: {}

  connect: (key, opts) ->
    return net if net = @networks[key]

    rand = Math.random().toString(36).substr(7, 3)
    nick = opts.nick.replace(/\$/g, rand)
    @networks[key] = new IRCNetwork(nick, opts)

  disconnect: (key) ->
    if key
      @networks[key].disconnect()
    else
      net.disconnect() for key, net of @networks
    return



module.exports = new IRCManager()
