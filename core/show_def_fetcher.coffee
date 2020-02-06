fs = require 'fs'
request = require 'request'
crc = require 'crc'
config = require '../config'

lastHash = null
showsFile = config.shows_file || __dirname + '/shows.json'

module.exports.loadShows = (showfn, callback) ->
  process = (err, data) ->
    if err
      console.log('error loading shows:', err)
      return

    hash = crc.crc32(data)
    return if hash == lastHash
    lastHash = hash

    try
      shows = JSON.parse(data)
      callback(shows)
    catch err
      console.log('error parsing shows:', err)

  showfn().then (data) ->
    fs.writeFile showsFile, data, -> process(null, data)
  .catch (err) ->
    console.log('error fetching shows, continuing with cache:', err)
    fs.readFile showsFile, 'utf8', process
