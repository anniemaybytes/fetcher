{State} = require './core/state'
config = require './config.coffee'
ab = require './ab'
_ = require 'underscore'


# IRC
irc = require './irc/irc'

for key, n of config.irc_networks
  irc.connect(key, n)


# State logic
upload = require './upload'
state = new State(config.state_db, config.storage_dir, upload)


# Command
{Cmdline} = require './core/cmdline'
cmdline = new Cmdline(state)


# HTTP
web = require './web'
web.boot(state)


# IRC control
{IRCCmdlineWrapper} = require './core/irc_cmdline_wrapper'
if config.irc_control
  ctrlNetwork = irc.connect(config.irc_control.network)
  ctrlChannel = config.irc_control.channel
  proxy = new IRCCmdlineWrapper(ctrlNetwork, ctrlChannel, '!' + ctrlNetwork.nick())
  cmdline.attach(proxy)


# Logging
state.on 'added', (meta) ->
  console.log('>>     added:', meta.file)
  ctrlNetwork?.say(ctrlChannel, "AIRING | added: #{meta.file}")

state.on 'completed', (meta) ->
  console.log('>> completed:', meta.file)
  ctrlNetwork?.say(ctrlChannel, "AIRING | completed: #{meta.file}")

state.on 'error', (err, meta) ->
  console.log('error (state):', err)

  if ctrlNetwork
    message = "errored"
    message += ": " + meta.file if meta
    message += " - " + err.message if err.message
    ctrlNetwork.say(ctrlChannel, "AIRING | #{message}")


# Feed + fetcher logic
{Feed} = require './core/feed'
require './feeds/rss_feed'
require './feeds/irc_feed'
{Fetcher} = require './core/fetcher'
require './fetchers/http_fetcher'
require './fetchers/xdcc_fetcher'
require './fetchers/torrent_fetcher'

{parseFilename, formatFilename} = require './core/file_meta'
sanitizeFilename = require("sanitize-filename")
unparseableCache = {}

attachFeed = (group, feed, fetchercls) ->
  feed.on 'new', (item, meta) ->
    throw new Error("missing group (feed is broken)") unless meta.group
    return unless item.title

    if item.title.endsWith('.torrent')
      item.title = item.title.substr(0, item.title.length - 8)

    show = group.findShow(item.title)
    return unless show

    meta = _.defaults(parseFilename(item.title), meta)
    return unless show.wantFile(meta)

    return if unparseableCache[item.title] # OVAs and other non-serial releases

    if !meta.container || !meta.episode
      # coffeelint: disable=max_line_length
      console.log('>> release missing container or episode:', item.title, '(container:', meta.container, ', episode:', meta.episode, ')')
      # coffeelint: enable=max_line_length
      unparseableCache[item.title] = true
      return

    if !item.title.endsWith('.' + meta.container)
      if item.title.match(/\.\w+$/)
        console.log(">> release has invalid extension (want .#{meta.container}):", item.title)
        unparseableCache[item.title] = true
        return

      item.title += '.' + meta.container

    meta.title = show.name
    meta.formatted = formatFilename(meta)
    meta.original = item.title
    meta.file = sanitizeFilename(item.title)
    meta.mtime = meta.ctime = new Date().toUTCString()
    meta.form = _.clone(show.form)
    _.extend(meta.form, show.releasers[group.key].form)

    fetcher = new fetchercls(item)
    state.fetch(fetcher, meta)

  feed.on 'error', (err) ->
    # Some sources frequently drop the connection and spam the logs.
    return if err?.code == 'ECONNRESET'

    name = feed.name || ""
    name = " #{name}" if name
    console.log("error (feed)#{name}:", err)

  feed

createSource = (group, source) ->
  feedcls = Feed.types[source.feed]
  throw new Error("unknown feed type " + source.feed) if !feedcls

  fetchercls = Fetcher.types[source.fetcher]
  throw new Error("unknown fetcher type " + source.fetcher) if !fetchercls

  attachFeed(group, new feedcls(source.feedopts), fetchercls)

# Create groups
{Group} = require './core/group'

groups = {}

refreshFeeds = ->
  if Object.keys(groups).length > 1
    count = Math.max(Object.keys(groups).length, 1)
    # time which each request must take at least
    minrate = 1500
    desired = 60000
    # pick whatever will take longer, either one minute or minimum request rate per second
    interval = Math.max(desired / count, minrate)
    # next fetch will be after all tasks finish, plus five minutes
    nextfetch = interval * count + 60000 * 5
    delay = 0
    for k, g of groups
      fetch = -> this.fetch()
      setTimeout(fetch.bind(g), delay)
      delay += interval
    console.log('fetching feeds, interval is ' + interval + ', next fetch in ' + nextfetch)
    setTimeout(refreshFeeds, nextfetch)
  else
    console.log('sleeping on refreshFeeds for 30s while waiting for groups to be fetched')
    setTimeout(refreshFeeds, 30*1000)

state.on 'ready', refreshFeeds


# Create shows
{Show} = require './core/show'
showFetcher = require './core/show_def_fetcher'

handleShow = (show) ->
  for key of show.releasers
    if !group = groups[key]
      console.log('missing releaser', key)
    else
      group.shows[show.name] = show

handleGroup = (key, meta) ->
  group = new Group(key, meta)
  group.feeds = group.sources.map(createSource.bind(null, group))
  groups[key] = group

reloadShowsAndGroups = ->
  showFetcher.loadShows ab.shows.bind(ab), (result) ->
    {shows, releasers} = result

    for key, group of groups
      group.feeds.forEach (feed) -> feed.detach()
      group.shows = {}

    groups = {}
    for key, meta of releasers
      handleGroup(key, meta)

    for name, sc of shows
      handleShow(new Show(name, sc))
    return

  setTimeout(reloadShowsAndGroups, 120000)

reloadShowsAndGroups()


# Exit handlers
exiting = false

onExit = ->
  process.exit() if exiting
  exiting = true
  irc.disconnect()
  setTimeout(onExit, 1000)

process.on 'SIGINT', onExit
process.on 'SIGTERM', onExit
