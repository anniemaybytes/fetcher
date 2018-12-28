fs = require 'fs'
file = __dirname + '/config.json'
data = fs.readFileSync(file, 'utf8')
module.exports = JSON.parse(data)

