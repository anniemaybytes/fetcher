{EventEmitter} = require 'events'

# Represents a generic feed of fetcher sources
# Fires events:
#   - 'new'
#   - 'error'
class exports.Feed extends EventEmitter
  @types: {}
  @type: null

  @register: (@type) ->
    Feed.types[@type] = this
