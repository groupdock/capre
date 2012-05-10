'use strict'

var _ = require('underscore')
var redis = require("redis")
var sanitize = require('./util').sanitize

var chef = require('YouAreDaChef').YouAreDaChef
var util = require('util')

var EventEmitter = require('events').EventEmitter

var Master = function(client) {
  this._client = client
  this.debug = false
}

util.inherits(Master, EventEmitter)

Master.prototype.flush = function(callback) {
  var self = this
  this._client.flushdb(function(err, result) {
    if (self.debug) console.info('Master flushed.')
    return callback(err, result === 'OK')
  })
}

// get current syndex for given type
Master.prototype.getSyndex = function(type, callback) {
  // syndex is just the length of the list
  this._client.llen('syndex:' + type, function(err, score) {
    if (err) return callback(err)
    callback(null, score)
  })
}

// mark that an id has changed for given type
// id can be single id or array of ids
Master.prototype.mark = function(type, id, callback) {
  var self = this
  // push id onto syndex list for given type
  this._client.rpush('syndex:' + type, id, function(err, syndex) {
    if (err) return callback(err)
    if (self.debug) console.info('marked', type, id, syndex)
    self.emit('mark', type, id, syndex)
    return callback(null, syndex)
  })
}

// get all ids that are above the given syndex
Master.prototype.getAboveSyndex = function(type, syndex, callback) {
  var multi = this._client.multi()
  multi.lrange('syndex:' + type, syndex, -1) // get items higher in the list than the supplied syndex
  multi.llen('syndex:' + type) // list length is current syndex
  multi.exec(function(err, results) {
    if (err) return callback(err)
    var syndex = results[1]
    var items = results[0]
    callback(null, items, syndex)
  })
}

// check and manipulate function arguments
chef(Master)
  .around('getAboveSyndex', 'mark', 'getSyndex', function(pointcut, type) {
    // create an error-throwing noop as default callback
    var callback = function(err) { if (err) throw err }
    if (typeof arguments[arguments.length - 1] === 'function') {
      callback = arguments[arguments.length - 1]
    }

    // swap out for noop callback (if it was changed)
    var args = Array.prototype.slice.call(arguments, 1)
    args.pop()
    args.push(callback)

    // check and sanitize type
    if (typeof type !== 'string' || !type) return callback(new Error('Master: type is required: ' + type))
    args.shift()
    args.unshift(sanitize(type))

    pointcut.apply(this, args)
  })
  .around('mark', function(pointcut, type, id) {
    var callback = arguments[arguments.length - 1]
    if (!id && id !== 0 || util.isArray(id) && !id.length || typeof id === 'function') {
      return callback(new Error('Master: id is required: ' + id))
    }
    // coerce id into a string or array of strings
    if (!util.isArray(id)) {
      id = sanitize(id)
    } else {
      // id is an array
      id = id.map(function(id) {
        return sanitize(id)
      })
    }
    pointcut.apply(this, [type, id, callback])
  })


module.exports = Master
