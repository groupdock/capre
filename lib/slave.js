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

// Flush tracking info for supplied name. Resets syndex.
Slave.prototype.flush = function(name, callback) {
  this._client.del(name, function(err, result) {
    return callback(err)
  })
}

// Get list of ids for app + type since last call to sync.
// Optionally supply a resetSyndex to explicitly get items newer than resetSyndex
Slave.prototype.sync = function(name, type, resetSyndex, callback) {
  var self = this
  this._client.hget('slave:'+name, type, function(err, currentSyndex) {
    if (err) return callback(err)
    if (resetSyndex != null) currentSyndex = resetSyndex
    currentSyndex = currentSyndex || 0

    // get all items in list with index > syndex
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
    // create an error-throwing noop as default callback
    var callback = function(err) { if (err) throw err }
    if (typeof arguments[arguments.length - 1] === 'function') {
      callback = arguments[arguments.length - 1]
    }

    // swap out for noop callback (if it was changed)
    var args = Array.prototype.slice.call(arguments, 2)
    args.pop()
    args.push(callback)

    // check and sanitize name
    if (typeof name !== 'string' || !name) return callback(new Error('Slave: name is required: ' + name))
    name = sanitize(name)
    args.unshift(name)

    pointcut.apply(this, args)
  })
  .around('sync', function(pointcut, name, type, resetSyndex) {
    var callback = arguments[arguments.length - 1]

    // resetSyndex is an optional argument
    if (resetSyndex === callback) {
      resetSyndex = null
    }

    // check and sanitize type
    if (type === callback || typeof type !== 'string' || !type) return callback(new Error('Slave: type is required: ' + type))
    type = sanitize(type)

    var args = [name, type, resetSyndex, callback]
    pointcut.apply(this, args)
  })


module.exports = Slave
