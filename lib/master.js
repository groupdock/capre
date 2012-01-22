var _ = require('underscore')

var EventEmitter = require('events').EventEmitter

var dnode = require('dnode')
var upnode = require('upnode')
var Server = require('./server')

var api = {
  getSyndex: function(callback) {
    callback(null, this.syndex)
  },
  create: function(resource, callback) {
    callback(null, resource, this.syndex++)
  }
}

var Master = function(port, callback) {
  if (typeof callback !== 'function') callback = function() {}
  this.syndex = 0
  this.port = port || 5000
  var self = this

  _.each(api, function(value, key) {
    api[key] = _.bind(value, self)
  })
  this.server = new Server(this.port, api, callback)
}

Master.prototype = new EventEmitter

module.exports = Master

