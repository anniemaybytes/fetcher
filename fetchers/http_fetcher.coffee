{Fetcher} = require '../core/fetcher'
request = require 'request'
_ = require 'underscore'

class exports.HTTPFetcher extends Fetcher
  @register('http')

  constructor: ({link}) ->
    @url = link
    super

  fetch: (stream) ->
    throw new Error('Fetch already started') if @req

    @req = request(@url)

    @req.on 'error', (err) =>
      @emit('error', err)

    @req.on 'response', (res) =>
      if res?.headers && length = res.headers['content-length']
        @started(length)
      else
        @emit('error', new Error('Missing content length'))

    @req.on 'data', (data) =>
      @progress(data.length)

    stream.on 'finish', =>
      @finished()

    @req.pipe(stream)

