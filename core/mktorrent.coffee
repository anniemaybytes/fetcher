{execFile} = require 'child_process'
Promise = require 'bluebird'
fs = require 'fs'
config = require '../config.coffee'

module.exports = (file, output, tracker) ->
  new Promise (resolve, reject) ->
    cmd = ['mktorrent', '-l', '19', '-p', '-a', tracker, file, '-o', output, '-s', config.tracker_source]

    retry = ->
      execFile '/usr/bin/env', cmd, (err, stdout, stderr) ->
        if err then reject(err) else resolve()

    execFile '/usr/bin/env', cmd, (err, stdout, stderr) ->
      if err?.message?.match(/file exists/i)
        console.log 'torrent exists, unlinking:', output
        fs.unlink output, retry
      else if err
        reject(err)
      else
        resolve()
