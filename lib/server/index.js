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
      if (err) self.emit('error', err)
      // set up capre methods as enode.Server's _api property
      var i = 0 // index to display beside log output
      _.each(Object.getPrototypeOf(self.capre), function(value, key) {
        self._api[key] = function() {
          var args = Array.prototype.slice.call(arguments, 0, -1)
          i++
          (function() {
            // removes meta property from enode
            winston.verbose(i + ':' + key + args)
            var callback = args.pop() // grab callback
            callback = _.wrap(callback, function(cb) {
              var cbArgs = Array.prototype.slice.call(arguments, 1)
              winston.verbose(i + ' : ' + key + ': ' + cbArgs.join(' '))
              cb.apply(self, cbArgs)
            })
            args.push(callback)
            self.capre[key].apply(self.capre, args)
          })(i)
        }
      })
      self._capre_ready = true
      self.emit('capre-ready')
    })
  })
  
  // override super.listen
  this.listen = function(port, callback) {
    var listen = function() {
      var super_ = Object.getPrototypeOf(self)
      return super_.listen.call(self, port, callback)
    }
    // wait for server to initialise
    if (!self._capre_ready) {
      self.on('capre-ready', function() {
        listen()
      })
    } else {
      listen()
    }
    return self
  }
}

util.inherits(Server, enode.Server)

module.exports = Server
