'use strict'

var EventEmitter = require('events').EventEmitter

var _ = require('underscore')
var chef = require('YouAreDaChef').YouAreDaChef

var Master = require('./master')
var sanitize = require('./util').sanitize
var Slave = function(master) {
  if (!(master instanceof Master)) throw new Error('Must pass a master instance to new Slave, instead got: ' + master)
  this._master = master
  this._client = master._client
}

Slave.prototype.flush = function(name, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof name !== 'string' || !name) return callback(new Error('name is required: ' + name))
  name = sanitize(name)
  this._client.del(name, function(err, result) {
    return callback(err)
  })
}

// Get Sync info from remote
Slave.prototype.sync = function(name, type, resetSyndex, callback) {
  var self = this
  this._client.hget('slave:'+name, type, function(err, currentSyndex) {
    if (err) return callback(err)
    if (resetSyndex != null) currentSyndex = resetSyndex
    currentSyndex = currentSyndex || 0
    self._master.getAboveSyndex(type, currentSyndex, function(err, items, syndex) {
      if (err) return callback(err)
      self._client.hset('slave:'+name, type, syndex, function(err) {
        if (err) return callback(err)
        callback(null, items, syndex)
      })
    })
  })
}

chef(Slave)
  .around('sync', 'flush', function(pointcut, name) {
    var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
    var args = Array.prototype.slice.call(arguments, 2)
    name = sanitize(name)
    if (typeof name !== 'string' || !name) return callback(new Error('Slave: name is required: ' + name))
    args.unshift(name)
    args.pop()
    args.push(callback)
    pointcut.apply(this, args)
  })
  .around('sync', function(pointcut, name, type, resetSyndex) {
    var callback = arguments[arguments.length - 1]
    if (resetSyndex === callback) {
      resetSyndex = null
    }
    if (type === callback || typeof type !== 'string' || !type) return callback(new Error('Slave: type is required: ' + type))
    type = sanitize(type)
    var args = [name, type, resetSyndex, callback]
    pointcut.apply(this, args)
  })

module.exports = Slave
