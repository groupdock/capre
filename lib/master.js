'use strict'

var _ = require('underscore')
var redis = require("redis")
var sanitize = require('./util').sanitize

var chef = require('YouAreDaChef').YouAreDaChef
var util = require('util')

var EventEmitter = require('events').EventEmitter

var Master = function(client) {
  this._client = client
}

util.inherits(Master, EventEmitter)

Master.prototype.flush = function(callback) {
  this._client.flushdb(function(err, result) {
    return callback(err, result === 'OK')
  })
}

Master.prototype.getSyndex = function(type, callback) {
  var client = this._client.multi()
  client.get('offset:' + type)
  client.llen('syndex:' + type)
  client.exec(function(err, result) {
    if (err) return callback(err)
    // withscores result = [item, score]
    var offset = parseInt(result[0]) || 0
    var score = parseInt(result[1]) || 0
    callback(null, score + offset)
  })
}

Master.prototype.mark = function(type, id, callback) {
  if (id instanceof Array) {
    this._markMany(type, id, callback)
  } else {
    this._mark(type, id, callback)
  }
}

Master.prototype._mark = function(type, id, callback) {
  this._client.rpush('syndex:' + type, id, function(err, syndex) {
    if (err) return callback(err)
    return callback(null, syndex)
  })
}

Master.prototype._markMany = function(type, ids, callback) {
  var self = this
  var key = 'syndex:' + type
  this._client.rpush(key, ids, function(err, syndex) {
    if (err) return callback(err)
    callback(null, syndex)
  })
}

Master.prototype.getAboveSyndex = function(type, syndex, callback) {
  var multi = this._client.multi()
  multi.lrange('syndex:' + type, syndex, -1)
  multi.llen('syndex:' + type)
  multi.exec(function(err, results) {
    if (err) return callback(err)
    var syndex = results[1]
    var items = results[0]
    callback(null, items, syndex)
  })
}

chef(Master)
  .around('mark', function(pointcut, type, id, callback) {
    var self = this
    var args = Array.prototype.slice.call(arguments, 1)
    args.pop() // pop off old callback
    args.push((function(type, id) {
      return function(err, syndex) { // push on new callback
        if (err && self.listeners('error').length) return self.emit('error', err) 
        self.emit('mark', type, id, syndex)
        callback(err, syndex)
      }
    })(type, id))
    pointcut.apply(this, args)
  })
  .around('getAboveSyndex', '_mark', '_markMany', 'mark', 'getSyndex', function(pointcut, type) {
    var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
    if (typeof type !== 'string' || !type) return callback(new Error('Master: type is required: ' + type))
    var args = Array.prototype.slice.call(arguments, 2)
    args.pop() // pop off callback
    args.push(callback) // push on processed callback
    type = sanitize(type)
    args.unshift(type)
    pointcut.apply(this, args)
  })
  .around('_mark', '_markMany', 'mark', function(pointcut, type, id) {
    var callback = arguments[arguments.length - 1]
    var args = Array.prototype.slice.call(arguments, 3)
    if (!id && id !== 0 || util.isArray(id) && !id.length || typeof id === 'function') {
      return callback(new Error('Master: id is required: ' + id))
    }
    if (!util.isArray(id)) id = String(id)
    args.unshift(type, id)
    pointcut.apply(this, args)
  })


module.exports = Master
