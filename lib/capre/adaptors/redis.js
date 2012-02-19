'use strict'

var _ = require('underscore')
var redis = require("redis")

var RedisAdaptor = function(options, callback) {
  var self = this
  if (arguments.length === 1 && typeof options === 'function') {
    callback = options
    options = undefined
  }
  options = options || {}
  var self = this
  process.nextTick(function() {
    var port = options.port
    var host = options.host
    delete options.port
    delete options.host
    self._client = self._client || redis.createClient(port, host, options)
    if (!self._client.ready) {
      self._client.on('ready', function() {
        return callback(null, true)
      })
    } else {
      return callback(null, true)
    }
  })
}

RedisAdaptor.prototype.flush = function(callback) {
  this._client.flushall(function(err, result) {
    return callback(err, result === 'OK')
  })
}

RedisAdaptor.prototype.getTypeInfo = function(type, callback) {
  this._client.zscore('type', type, function(err, score) {
    if (score === null) {
      callback(null, false)
    } else {
      callback(null, {syndex: parseInt(score), type: type})
    }
  })
}

RedisAdaptor.prototype.register = function(type, callback) {
  var typeItem = {syndex: 0, type: type}
  this._client.zadd('type', typeItem.syndex, typeItem.type, function(err) {
    if (err) return callback(err)
    return callback(null, typeItem)
  })
}

RedisAdaptor.prototype.getTypes = function(callback) {
  this._client.zrange('type', 0, -1, function(err, items) {
    if (err) return callback(err)
    return callback(null, items)
  })
}

RedisAdaptor.prototype._mark = function(type, id, syndex, callback) {
  this._client.zadd('syndex:' + type, syndex, id, function(err, result) {
    if (err) return callback(err)
    var item = {
      id: id,
      syndex: syndex
    }
    return callback(null, item)
  })
}

RedisAdaptor.prototype.insert = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}

RedisAdaptor.prototype.update = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}

RedisAdaptor.prototype.remove = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}


RedisAdaptor.prototype.find = function(type, id, callback) {
  this._client.zscore('syndex:' + type, id, function(err, result) {
    if (err) return callback(err)
    if (result === null) {
      return callback(null, false)
    } else {
      var item = {
        id: id,
        syndex: result,
      }
      return callback(null, item)
    }
  })
}

RedisAdaptor.prototype.bumpSyndex = function(type, callback) {
  var self = this
  self._client.zincrby('type', 1, type, function(err, val) {
    return callback(err, val)
  })
}

RedisAdaptor.prototype.setSyndex = function(type, syndex, callback) {
  var self = this
  self._client.zadd('type', syndex, type, function(err, val) {
    return callback(err, syndex)
  })
}

RedisAdaptor.prototype.getAboveSyndex = function(type, syndex, callback) {
  var self = this
  this._client.zrangebyscore('syndex:' + type, '(' + syndex, +Infinity, function(err, results) {
    if (err) return callback(err)
    callback(null, results)
  })
}

module.exports = RedisAdaptor

