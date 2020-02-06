config = require './config.coffee'
express = require('express')
_ = require('underscore')

app = express()

app.set('view engine', 'jade')

segments = (path) ->
  arr = _.compact(path.split('/'))
  arr = arr.map (s) -> {title: decodeURI(s), uri: s}

  concat = (memo, seg) -> seg.uri = memo + '/' + seg.uri
  _.reduce(arr, concat, '')

  arr.unshift({title: 'index', uri: '/'})
  arr

app.use (req, res, next) ->
  res.locals.path = segments(req.path)
  res.locals._ = _
  next()

app.get '/', (req, res) ->
  app.state.list().then (files) ->
    shows = _.groupBy files, (file) -> file.meta.state
    res.render('index', {shows: _.omit(shows, 'complete')})

app.get '/shows', (req, res) ->
  app.state.list().then (files) ->
    shows = _.groupBy files, (file) -> file.meta.title

    for key, show of shows
      show.latest = _.max(show, (file) -> file.meta.episode)

    res.render('shows', {shows})

app.get '/shows/:title', (req, res) ->
  title = req.params.title

  app.state.list().then (files) ->
    show = _.filter files, (file) -> file.meta.title == title
    show = show.sort (a, b) -> a.meta.file.localeCompare(b.meta.file)
    show.latest = _.max(show, (file) -> file.meta.episode)

    res.render('show', {show})

app.use('/files', express.static(config.storage_dir))

app.use(express.static('static'))

module.exports.boot = (state) ->
  app.state = state

  server = app.listen config.http_port, ->
    {address, port} = server.address()
    console.log('HTTP listening on http://%s:%s', address, port)
