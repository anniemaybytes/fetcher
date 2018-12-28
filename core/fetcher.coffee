{EventEmitter} = require 'events'

EventEmitter.defaultMaxListeners = 0;

# Represents a generic fetcher
# Fires events:
#   - 'done'
#   - 'error'
class exports.Fetcher extends EventEmitter
  @types: {}
  @type: null

  @register: (@type) ->
    Fetcher.types[@type] = this

  length: null
  fetched: 0
  args: []

  constructor: ->
    @args = [].slice.call(arguments)

  started: (length) ->
    length = parseInt(length, 10)
    throw new Error('Multiple length definitions') if @length? && @length != length
    @length = length
    @emit('start')

  progress: (progress) ->
    @fetched += progress
    throw new Error('Fetched past EOF') if @fetched > @length
    @emit('progress', @fetched, @length)

  finished: ->
    if @fetched < @length
      return @emit('error', new Error('Unexpected EOF'))

    @emit('done', this)

  toJSON: ->
    {type: @constructor.type, args: @args}

