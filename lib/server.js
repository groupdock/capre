var _ = require('underscore')

var EventEmitter = require('events').EventEmitter

var dnode = require('dnode')
var upnode = require('upnode')

var Server = function(port, api, callback) {
  // api is optional
  if (arguments.length === 2 && typeof api === 'function') {
    callback = api
    api = {}
  }
  if (typeof callback !== 'function') callback = function() {}
  this.api = api
  this.port = port || 5000

  process.nextTick(this.listen.bind(this, this.port, this.api, callback))
}

Server.prototype = new EventEmitter

Server.prototype.listen = function(port, api, callback) {
  if (typeof callback !== 'function') callback = function() {}
  this.dnode = this.dnode || dnode(function() {
    _.extend(this, api)
  })

  this.dnode.use(upnode.ping)

  this.dnode.on('ready', function() {
    return callback()
  })
  this.dnode.listen(port)
}

module.exports = Server


