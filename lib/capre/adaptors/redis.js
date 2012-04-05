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

RedisAdaptor.prototype.getSyndex = function(type, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
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

RedisAdaptor.prototype.mark = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  if (!id || id === callback) return callback(new Error('id required'))
  if (id instanceof Array) {
    this._markMany(type, id, callback)
  } else {
    this._mark(type, id, callback)
  }
}

RedisAdaptor.prototype.find = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  if (id instanceof Array) {
    this._findMany(type, id, callback)
  } else {
    this._find(type, id, callback)
  }
}

RedisAdaptor.prototype._mark = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  this._client.rpush('syndex:' + type, id, function(err, syndex) {
    if (err) return callback(err)
    return callback(null, syndex)
  })
}

RedisAdaptor.prototype._markMany = function(type, ids, callback) {
  var self = this
  //var multi = this.`_client.multi()
  var key = 'syndex:' + type
  //for (var i = 0; i < ids.length; i++) {
    //multi.zincrby(key, 1, ids[i])
  //}
  this._client.rpush(key, ids, function(err, syndex) {
    if (err) return callback(err)
    callback(null, syndex)
  })
}

RedisAdaptor.prototype._find = function(type, id, callback) {
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

RedisAdaptor.prototype._findMany = function(type, ids, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
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

RedisAdaptor.prototype.getAboveSyndex = function(type, syndex, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  var self = this
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

module.exports = RedisAdaptor
