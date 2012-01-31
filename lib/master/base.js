var Client = require('enode').Client
var Server = require('../server')

var EventEmitter = require('events').EventEmitter

var _ = require('underscore')

// both arguments are optional. 
var Base = function(backend, options) {
  this._backendType = backend
  this._options = options
}

Base.prototype = new EventEmitter()

Base.prototype.shutdown = function(callback) {
  this._backend.shutdown(callback)
}

Base.prototype.connect = function(host, callback) {
  this._backend = new Client(host)
  var self = this
  // copy remote methods to Master object
  self._backend.connect(host, function(err, remote, connection) {
    self.capre = {}
    _.extend(self, remote)
    callback(err)
  })
  return this
}

Base.prototype.listen = function(port, callback) {
  var self = this
  var backendType = this._backendType
  var options = this._options
  this._backend = new Server(backendType, options)
  // copy remote methods to this object
  self._backend.listen(port, function(err) {
    self.capre = {}
    _.extend(self, self._backend.capre)
    callback(err, self)
  })
  return this
}

module.exports = Base
