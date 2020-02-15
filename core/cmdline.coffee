{EventEmitter} = require 'events'

class exports.Cmdline
  constructor: (@state) ->
    undefined

  attach: (impl) ->
    impl.on 'input', (line) => @perform(line, impl.output)

  perform: (line, output) ->
    @usage(output)

  usage: (output) ->
    output('')
