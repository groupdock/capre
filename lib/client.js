var EventEmitter = require('events').EventEmitter

var dnode = require('dnode')
var upnode = require('upnode')
var _ = require('underscore')

var Client = function(host, api, callback) {
  this.host = host
  this.api = api || function() {}
  
  process.nextTick(this.connect.bind(this, this.host, this.api, callback))
}

Client.prototype = new EventEmitter

Client.prototype.connect = function(host, api, callback) {
  var self = this
  this.up = this.up || upnode.connect(host)
  this.up.on('up', (function(remote, connection) {
    this.remote = remote
    this.connection = connection
    callback(null, remote, connection)
  }).bind(this))
}

Client.prototype.create = function(resource, callback) {
  var self = this
  this.remote.create(resource, function() {
    callback.apply(self, arguments)
  })
}

module.exports = Client
