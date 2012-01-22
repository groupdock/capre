var EventEmitter = require('events').EventEmitter

var dnode = require('dnode')
var upnode = require('upnode')
var Client = require('./client')

var Slave = function(host, callback) {
  this.host = host
  var self = this
  process.nextTick((function() {
    this.client = this.client || new Client(host, {}, callback)
  }).bind(this))
}

Slave.prototype = new EventEmitter

Slave.prototype.getSyndex = function(callback) {
  var self = this
  this.client.remote.getSyndex(function() {
    callback.apply(self, arguments)
  })
}

Slave.prototype.create = function(resource, callback) {
  var self = this
  this.client.remote.create(resource, function() {
    callback.apply(self, arguments)
  })
}



module.exports = Slave
