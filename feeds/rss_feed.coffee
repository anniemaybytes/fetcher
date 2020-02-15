{Feed} = require '../core/feed'
FeedParser = require 'feedparser'
request = require 'request'
url = require 'url'
path = require 'path'
_ = require 'underscore'

# Not directly available through the config files - should be subclassed.
class exports.RSSFeed extends Feed
  lastUpdate: null

  constructor: (@streamfn, @options) ->
    @options.allowDuplicates ?= true

  fetch: ->
    parser = new FeedParser()
    stream = null

    @streamfn.call this, (s) ->
      stream = s
      s.pipe(parser)

    parser.on 'error', (err) =>
      @emit('error', err)

    prevUpdate = @lastUpdate
    thisUpdate = null
    newEntries = []
    {allowDuplicates} = @options

    parser.on 'readable', ->
      while item = @read()
        if !thisUpdate || item.date > thisUpdate
          thisUpdate = item.date

        # note, does not properly handle entries with equal dates
        if !allowDuplicates && item.date < prevUpdate
          continue

        newEntries.push(item)

    handleFile = (title, link) =>
      meta = _.defaults({title}, @options.meta)
      @emit('new', {title, link}, meta)

    handleNew = (item) ->
      if item.enclosures?.length
        for f in item.enclosures
          linkpath = url.parse(f.url).path
          title = unescape(path.basename(linkpath))
          handleFile(title, f.url)
      else
        handleFile(item.title, item.link)

    parser.on 'end', =>
      stream?.close?()
      handleNew(item) for item in newEntries
      @lastUpdate = thisUpdate

    return


class exports.HTTPRSSFeed extends exports.RSSFeed
  @register('rss')

  constructor: (options) ->
    {@url} = options
    @name = @url
    super(@openHTTP, options)

  detach: ->
    undefined

  openHTTP: (cb) ->
    req = request(@url)

    req.on 'error', (err) =>
      @emit('error', err)

    req.on 'response', (res) ->
      if res.statusCode != 200 # emits on the request object
        return @emit('error', new Error('Status code not OK - received ' + res.statusCode))


      cb(this)
