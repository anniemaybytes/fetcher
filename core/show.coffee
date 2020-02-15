_ = require 'underscore'

class exports.Show
  constructor: (name, options) ->
    @name = name
    {@id, @formats, @form} = options

    for key, rel of options.releasers
      if !rel.regex || rel.regex.match(/^\s*$/)
        console.log(">> #{name} - releaser missing pattern: #{JSON.stringify(rel)}")
        delete options.releasers[key]

    @releasers = _.mapObject options.releasers, (rel) ->
      regex: new RegExp(rel.regex, 'i')
      form: {media: rel.media, subbing: rel.subbing}

  wantFile: (meta) ->
    _.contains(@formats, meta.res)
