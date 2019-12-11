
pad = (n, width) ->
  n = n + ''
  return n if n.length >= width
  new Array(width - n.length + 1).join('0') + n

crcRegex = /(..+)([a-f\d]{8}|[A-F\d]{8})(.*)/
episodeRegex = /.*[^\w](?:EP|E|S\d+E)?(\d{2,3}|(?<=Episode\s)\d{1,3})(v0?\d)?(?:[^\w]|$)/i

splice = (filename, substring) ->
  index = filename.indexOf(substring)
  return if index == -1
  filename.substr(0, index) + filename.substr(index + substring.length)

spliceEnd = (filename, substring) ->
  index = filename.indexOf(substring)
  return if index != filename.length - substring.length
  filename.substr(0, index)

resolutions =
  # Set to a falsy value to use the key as the identifier.
  '640×360': 0
  '720x480': 0
  '960x720': 0
  '704x396': 0
  '848x480': 0
  '1024x576': 0
  '480×360': '360p'
  '640x480': '480p'
  '1280x720': '720p'
  '1920x1080': '1080p'
  '360p': 0
  '480p': 0
  '720p': 0
  '1080p': 0

exports.formatFilename = (meta)->
  extra = ""
  extra += "[#{res}]" if res = meta.res
  extra += "[#{group}]" if group = meta.group
  extra += "[#{crc}]" if crc = meta.crc
  extra = " #{extra}" if extra

  v = ""
  v = "v#{meta.version}" if meta.version > 1

  "#{meta.title} - #{pad(meta.episode, 2)}#{v}#{extra}.#{meta.container}"

exports.parseFilename = (filename) ->
  parsed =
    episode: undefined,
    res: undefined,
    container: undefined,
    crc: undefined,
    version: 1

  lastDot = filename.lastIndexOf('.')

  if lastDot != -1
    parsed.container = filename.substr(lastDot + 1)
    filename = filename.substr(0, lastDot)

  filename = filename.replace(/[_.]/g, ' ')

  # Parse and splice the resolution.
  for res of resolutions
    if newFilename = splice(filename, res)
      filename = newFilename
      parsed.res ?= resolutions[res] || res
      break

  if match = filename.match(crcRegex)
    parsed.crc = match[2].toUpperCase()
    filename = match[1] + match[3]

  if match = filename.match(episodeRegex)
    parsed.episode = parseInt(match[1], 10)
    parsed.version = parseInt(match[2].substr(1), 10) if match[2]

  parsed

