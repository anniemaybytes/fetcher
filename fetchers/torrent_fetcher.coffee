{Fetcher} = require '../core/fetcher'
WebTorrent = require 'webtorrent'
config = require '../config.coffee'
_ = require 'underscore'

noPeerTimeout = 5 * 60 * 1000 # 5 minutes
maxActiveDownloads = 5

activeDownloads = 0
client = new WebTorrent({
  maxPeers: 50,
  maxConns: 50,
  dht: true,
  webSeeds: false,
  tracker: {
    wrtc: false
  }
})
client.on 'error', (err) =>
  calculateActiveDownloads()
  @emit('error', err)

calculateActiveDownloads = ->
  activeDownloads = 0
  for t in client.torrents
    if t.numPeers > 0 && t.progress < 1
      activeDownloads++

class exports.TorrentFetcher extends Fetcher
  @register('torrent')

  constructor: ({link}) ->
    @torrentid = link
    super

  fetch: (stream) ->
    throw new Error('Fetch already started') if @torrent

    if activeDownloads >= maxActiveDownloads
      # Throttle active torrent downloads.
      setTimeout((=> @fetch(stream)), 10000)
    else
      activeDownloads++
      setTimeout((=> @addTorrent(stream)), 500)
      

  addTorrent: (stream) ->
    @torrent = client.add(@torrentid, {path: config.webtorrent_dir})
    @torrent.on 'error', (err) =>
    	activeDownloads--
    	@emit('error', err)

    if @torrent.ready
      @processTorrent(stream, @torrent)
    else
      @torrent.on 'ready', => @processTorrent(stream, @torrent)

  processTorrent: (output, torrent) ->
    if torrent.files.length != 1
      @emit('error', new Error('torrent has ' + torrent.files.length + ' files, must have 1'))
      activeDownloads--
      return

    @started(torrent.length)

    @startDate = Date.now()

    torrent.on 'noPeers', (announceType) =>
      # Take into account global number of peers, including DHT if enabled
      if (Date.now() - @startDate) >= noPeerTimeout && torrent.numPeers == 0 && torrent.progress < 1
        activeDownloads--
        @emit('error', new Error('torrent has no peers'))

    torrent.on 'download', =>
      @progress(torrent.downloaded - @fetched)

    output.on 'finish', =>
      @progress(torrent.downloaded - @fetched)
      @finished()
      torrent.pause()
      activeDownloads--

      destroyTorrent = ->
        torrent.destroy -> torrent.store?.destroy()

      setTimeout(destroyTorrent, 10000)

    file = torrent.files[0]
    input = file.createReadStream()
    input.pipe(output)
