request = require 'request'
{async, await} = require 'asyncawait'
Promise = require 'bluebird'
config = require './config'
_ = require 'underscore'
fs = require 'fs'


jar = request.jar()
request = Promise.promisify(request)

{tracker_user: username, tracker_pass: password, shows_uri} = config

assertStatus = (status, response, message) ->
  if response.statusCode != status
    throw new Error("#{message} (#{response.statusCode})")

module.exports.auth = async ->
  opts = {uri: 'https://animebytes.tv/user/login', followRedirect: false, jar}
  [response, body] = await request(opts)
  return if response.statusCode == 303 # Already authenticated.
  assertStatus(200, response, 'upload server unavailable')

  csrfi = body.match(/_CSRF_INDEX"\s+value="(.*)"\s\/></)[1]
  csrfx = body.match(/_CSRF_TOKEN"\s+value="(.*)"\s\/>/)[1]

  opts = {
    uri: 'https://animebytes.tv/user/login'
    method: 'post'
    form: {username, password, keeplogged: 'on', _CSRF_INDEX: csrfi, _CSRF_TOKEN: csrfx}
    followRedirect: false
    jar
  }
  [response, body] = await request(opts)
  assertStatus(303, response, 'upload login failed')

  opts = {uri: 'https://animebytes.tv/upload.php', followRedirect: false, jar}
  [response, body] = await request(opts)
  assertStatus(200, response, 'upload login verification failed')

module.exports.upload = async (media, torrent, meta) ->
  return unless groupid = meta.form.groupid

  res = meta.res
  res = '848x480' if res == '480p'

  formData = {
    groupid: groupid,
    submit: 'true'
    form: 'anime'
    section: 'anime'
    add_format: '1'
    CatID: '1'
    file_input: fs.createReadStream(torrent)
    downmultiplier: '0'
    upmultiplier: '1'
    media: meta.form.media
    containers: meta.container.toUpperCase()
    codecs: media.codec
    resolution: res
    audio: media.audio
    audiochannels: media.audiochannels
    sequence: meta.episode
    release_group_name: meta.group
    subbing: meta.form.subbing
    remaster: 'on'
    mediainfo_desc: "#{media.text}"
  }

  console.log('>> uploading:', meta.file)
  await module.exports.auth()

  opts = {uri: "https://animebytes.tv/upload.php?type=anime&groupid=#{groupid}", method: 'post', formData, jar}
  [response, body] = await request(opts)

  if response.statusCode == 409
    console.log('>>  conflict:', meta.file)
    return

  if body.match(/torrent file already exists/i)
    console.log('>>    exists:', meta.file)
    return

  assertStatus(200, response, 'upload failed')

  if body.match(/the following error/i)
    err = 'unknown reason'

    if errMatch = body.match(/the following error.*\n.*<p .*?>(.*)<\/p>/im)
      err = errMatch[1].replace(/<br.*?>/g, ' ')

    throw new Error('upload failed: ' + err)

  console.log('>>  uploaded:', meta.file)

module.exports.shows = async ->
  await module.exports.auth()

  opts = {uri: shows_uri, followRedirect: false, jar}
  [response, body] = await request(opts)
  assertStatus(200, response, 'show fetch failed')

  body
