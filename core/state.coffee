fs = require 'fs'
{EventEmitter} = require 'events'
{Fetcher} = require './fetcher'
path = require 'path'
levelup = require 'level'
{async, await} = require 'asyncawait'
Promise = require 'bluebird'

class exports.State extends EventEmitter
  constructor: (stateFile, @dir, @finalize = ->) ->
    @db = levelup(stateFile, {valueEncoding: 'json'})
    st = @db.createReadStream()
    fetches = []

    st.on 'error', @emit.bind(@, 'error')

    st.on 'data', (data) =>
      {meta, fetcher} = data.value
      return if meta.state == 'complete'

      cls = Fetcher.types[fetcher.type]
      meta.state = 'restarting'
      fetches.push @fetch(new cls(fetcher.args...), meta)

    st.on 'end', =>
      Promise.all(fetches).then @emit.bind(@, 'ready')

  wantFile: (meta) -> new Promise (resolve, reject) =>
    return resolve(true) if meta.state == 'restarting'

    @db.get @keyFor(meta), (err, val) ->
      have = val && val.meta.state in ['complete', 'pending', 'fetching', 'persisting']
      resolve(!have)

  fetch: async (fetcher, meta) ->
    return unless await @wantFile(meta)

    meta.path = path.resolve(path.join(@dir, meta.file))
    await @addFetcher(meta, fetcher)

    stream = fs.createWriteStream(meta.path, {mode: 0o644})

    fetcher.on 'error', (err) => @errorFetcher(meta, fetcher, err)
    fetcher.on 'done', (err) => @completeFetcher(meta, fetcher)
    fetcher.on 'start', => @startFetcher(meta, fetcher)

    try
      fetcher.fetch(stream)
    catch err
      console.error(err.stack)
      @errorFetcher(meta, fetcher, err)
    return

  addFetcher: async (meta, fetcher) ->
    meta.state = 'pending'
    delete meta.err
    await @persist(meta, fetcher)
    @emit('added', meta)

  startFetcher: async (meta, fetcher) ->
    return if meta.state == 'failed'

    meta.state = 'fetching'
    delete meta.err
    await @persist(meta, fetcher)
    @emit('started', meta)

  completeFetcher: async (meta, fetcher) ->
    return if meta.state == 'failed'

    meta.state = 'persisting'
    delete meta.err
    await @persist(meta, fetcher)

    try
      await @finalize(meta)
    catch err
      console.error(err.stack)
      @errorFetcher(meta, fetcher, err)
      return

    meta.state = 'complete'
    await @persist(meta, fetcher)
    @emit('completed', meta)

  errorFetcher: async (meta, fetcher, err) ->
    err.key = @keyFor(meta) unless err.key

    meta.err = err.message
    meta.state = 'failed'
    await @persist(meta, fetcher)
    @emit('error', err, meta)

  persist: async (meta, fetcher) ->
    meta.mtime = new Date().toUTCString()
    op = @db.batch().put(@keyFor(meta), {meta, fetcher})

    try
      await Promise.promisify(op.write, op)
    catch err
      @emit('error', err, meta)
      throw err

  keyFor: (meta) ->
    'file::' + (meta.formatted || meta.file)

  list: async -> new Promise (resolve, reject) =>
    st = @db.createReadStream()
    files = []

    st.on 'error', (err) -> reject(err)
    st.on 'data', (data) -> files.push(data.value)
    st.on 'end', -> resolve(files)
