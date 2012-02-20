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
  this._client.flushdb(function(err, result) {
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
  syndex = parseInt(syndex)
  this._client.zadd('syndex:' + type, syndex, id, function(err, result) {
    if (err) return callback(err)
    var item = {
      id: id,
      syndex: syndex
    }
    return callback(null, item)
  })
}


RedisAdaptor.prototype._markMany = function(type, ids, syndex, callback) {
  var self = this
  var multi = this._client.multi()
  var key = 'syndex:' + type
  syndex = parseInt(syndex)
  for (var i = 0; i < ids.length; i++) {
    multi.zadd(key, syndex, ids[i])
  }
  multi.exec(function(err, items) {
    var results = []
    if (err) return callback(err)
    for (var i = 0; i < items.length; i++) {
      var item = {
        id: ids[i],
        syndex: syndex
      }
      results.push(item)
    }
    callback(null, results)
  })
}

RedisAdaptor.prototype.insert = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}
RedisAdaptor.prototype.insertMany = function(type, id, syndex, callback) {
  return this._markMany.apply(this, arguments)
}

RedisAdaptor.prototype.update = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}
RedisAdaptor.prototype.updateMany = function(type, id, syndex, callback) {
  return this._markMany.apply(this, arguments)
}

RedisAdaptor.prototype.remove = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}
RedisAdaptor.prototype.removeMany = function(type, id, syndex, callback) {
  return this._markMany.apply(this, arguments)
}


RedisAdaptor.prototype.find = function(type, id, callback) {
  this._client.zscore('syndex:' + type, id, function(err, result) {
    if (err) return callback(err)
    if (result === null) {
      return callback(null, result)
    } else {
      var item = {
        id: id,
        syndex: parseInt(result),
      }
      return callback(null, item)
    }
  })
}

RedisAdaptor.prototype.findMany = function(type, ids, callback) {
  var self = this
  var multi = this._client.multi()
  var key = 'syndex:' + type
  for (var i = 0; i < ids.length; i++) {
    multi.zscore(key, ids[i])
  }
  multi.exec(function(err, items) {
    var results = []
    if (err) return callback(err)
    for (var i = 0; i < items.length; i++) {
      if (items[i] !== null) {
        var item = {
          id: ids[i],
          syndex: parseInt(items[i])
        }
        results.push(item)
      }
    }
    if (results.length == 0) results = null
    callback(null, results)
  })
}

RedisAdaptor.prototype.bumpSyndex = function(type, callback) {
  var self = this
  self._client.zincrby('type', 1, type, function(err, val) {
    return callback(err, parseInt(val))
  })
}

RedisAdaptor.prototype.setSyndex = function(type, syndex, callback) {
  var self = this
  syndex = parseInt(syndex)
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
