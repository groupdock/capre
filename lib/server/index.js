'use strict'

var enode = require('enode')
var util = require('util')
var Capre = require('../capre')
var _ = require('underscore')
var winston = require('winston')

var util = require('util')

var Server = function(backend, options) {
  Server.super_.call(this)
  var self = this
  var Backend = require('../capre/adaptors/' + backend)
  this.backend = new Backend(options, function() {
    self.capre = new Capre(self.backend, function(err) {
      if (err) self.emit('error', err); 
    })
    // set up capre methods as remote methods
      var i = 0
    _.each(Object.getPrototypeOf(self.capre), function(value, key) {
      self._api[key] = function() {
        var args = Array.prototype.slice.call(arguments, 0, -1) 
        i++
        (function() {
          // removes meta property from enode
          winston.verbose(i + ':' + key + args)
          var callback = args.pop() // grab callback
          callback = _.wrap(callback, function(cb) {
            var args = Array.prototype.slice.call(arguments, 1)
            winston.verbose(i + ' : ' + key + ': ' + args.join(' '))
            cb.apply(self, args)
          })
          args.push(callback)
          self.capre[key].apply(self.capre, args)
        })(i)
      }
    })
  })
}

util.inherits(Server, enode.Server)

module.exports = Server
