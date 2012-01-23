'use strict'

var _ = require('underscore')
var redis = require("redis")

var MasterRedisAdaptor = function(callback) {
  var self = this
  process.nextTick(function() {
    self._client = self._client || redis.createClient()
    if (!self._client.ready) {
      self._client.on('ready', function() {
        return callback(null, true)
      })
    } else {
      return callback(null, true)
    }
  })
}

MasterRedisAdaptor.prototype.flush = function(callback) {
  this._client.flushall(function(err, result) {
    return callback(err, result === 'OK')
  })
}

MasterRedisAdaptor.prototype.getTypeInfo = function(type, callback) {
  this._client.zscore('type', type, function(err, score) {
    if (score === null) {
      callback(null, false)
    } else {
      callback(null, {syndex: score, type: type})
    }
  })
}

MasterRedisAdaptor.prototype.register = function(type, callback) {
  this._client.zadd('type', 0, type, function(err, success) {
    if (err) return callback(err)
    if (!success) return callback(new Error('something went wrong adding type to redis'))
    return callback(null, {syndex: 0, type: type})
  })
}

MasterRedisAdaptor.prototype.getTypes = function(callback) {
  this._client.zrange('type', 0, -1, function(err, items) {
    if (err) return callback(err)
    return callback(null, items)
  })
}

MasterRedisAdaptor.prototype.bumpSyndex = function(type, callback) {
  var self = this
  this.getTypeInfo(type, function(err, typeInfo) {
    if (!typeInfo) {
      callback(null, null)
    } else {
      self._client.zincrby('type', 1, type, function(err, val) {
        callback(null, val)
      })
    }
  })
}

MasterRedisAdaptor.prototype._mark = function(type, id, syndex, callback) {
  this._client.zadd('syndex:' + type, syndex, id, function(err, result) {
    if (err) return callback(err)
    var item = {
      id: id,
      syndex: syndex
    }
    return callback(null, item)
  })
}

MasterRedisAdaptor.prototype.insert = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}

MasterRedisAdaptor.prototype.update = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}

MasterRedisAdaptor.prototype.remove = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}


MasterRedisAdaptor.prototype.find = function(type, id, callback) {
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

MasterRedisAdaptor.prototype.getAboveSyndex = function(type, syndex, callback) {
  var self = this
  this._client.zrangebyscore('syndex:' + type, syndex, '+inf', function(err, results) {
    if (err) return callback(err)
    callback(null, results)
  })
}

module.exports = MasterRedisAdaptor

