'use strict'

var util = require('util')
var enode = require('enode')
var _ = require('underscore')

var Capre = require('../capre/')

var Master = function() {
  Master.super_.call(this)
}

util.inherits(Master, enode.Client)

Master.prototype.connect = function(server, callback) {
  var _super = Object.getPrototypeOf(Object.getPrototypeOf(this))
  var self = this
  // copy remote methods to Master object
  return _super.connect.call(this, server, function(err, remote, connection) {
    _.extend(self, remote)
    callback(err, remote, connection)
  })
}

Master.prototype.create = function(backend, options, callback) {
  // backend is optional
  if (arguments.length === 1 && typeof backend === 'function') {
    callback = backend
    options = null
    backend = null
  }
  // options is optional
  if (arguments.length === 2 && typeof options === 'function') {
    callback = backend
    options = null
  }
  backend = backend || 'redis'
  options = options || {}

  var self = this
  var Backend = require('../capre/adaptors/' + backend)
  this.backend = new Backend(options, function() {
    self._capre = new Capre(self.backend, function(err) {
      _.extend(self, self._capre)
      callback.apply(self, arguments)
    })
  })
}

module.exports = Master
