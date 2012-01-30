'use strict'

var util = require('util')
var enode = require('enode')
var _ = require('underscore')

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


module.exports = Master
