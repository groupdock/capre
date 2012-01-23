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

MasterRedisAdaptor.prototype.isRegistered = function(type, callback) {
  this._client.zrank('type', type, function(err, rank) {
    if (rank === null) {
      callback(null, false)
    } else {
      callback(null, {syndex: rank, type: type})
    }
  })
}

MasterRedisAdaptor.prototype.register = function(type, callback) {
  var self = this
  this.isRegistered(type, function(err, isRegistered) {
    if (isRegistered) {
      callback(null, false)
    } else {
      self._client.zadd('type', 0, type, function(err, success) {
        if (err) return callback(err)
        if (!success) return callback(new Error('something went wrong adding type to redis'))
        return callback(null, {syndex: 0, type: type})
      })
    }
  })
}

MasterRedisAdaptor.prototype.getTypes = function(callback) {
  var self = this
  this._client.zrange('type', 0, -1, function(err, items) {
    if (err) return callback(err)
    return callback(null, items)
  })
}


MasterRedisAdaptor.prototype.update = function(type, id, syndex, callback) {
  this.find(type, id, function(err, found) {
    if (err) return callback(err)
    if (found) {
      found.syndex = syndex
      found.op = 'update'
      return callback(null, found)
    } else {
      return callback(null, false)
    }
  })
}

MasterRedisAdaptor.prototype.bumpSyndex = function(type, callback) {
  var self = this
  this.isRegistered(type, function(err, isRegistered) {
    if (!isRegistered) {
      callback(null, null)
    } else {
      self._client.zincrby('type', 1, type, function(err, val) {
        callback(null, val)
      })
    }
  })
}

MasterRedisAdaptor.prototype.insert = function(type, id, syndex, callback) {
  var self = this
  var multi = this._client.multi()
  multi.zadd('syndex:' + type, syndex, id)
  multi.set('op:' + id, 'insert')
  multi.exec(function(err, result) {
    if (err) return callback(err)
    var syndex = result[0]
    var item = {
      id: id,
      syndex: syndex,
      op: 'insert'
    }
    return callback(null, item)
  })
  //, function(err) {
    //if (err) return callback(err)
    //this._client.set('op:' + id, 'insert')
    //return callback(null, true)
  //})
  //if(!this._store[type]) return callback(null, false)
  //this.find(type, id, function(err, found) {
    //if (err) return callback(err)
    //if (found) return callback(null, false)
    //var item = {id: id, syndex: syndex, op: 'insert'}
    //self._store[type].items.push(item)
    //return callback(null, item)
  //})
}

MasterRedisAdaptor.prototype.remove = function(type, id, syndex, callback) {
  this.find(type, id, function(err, found) {
    if (err) return callback(err)
    if (found) {
      if (err) return callback(err)
      found.syndex = syndex
      found.op = 'remove'
      return callback(null, found)
    } else {
      return callback(null, false)
    }
  })
}

MasterRedisAdaptor.prototype.find = function(type, id, callback) {
  var multi = this._client.multi()
  multi.zrank(type, id)
  multi.get('op:' + id)
  multi.exec(function(err, results) {
    if (results[0] === null) {
      return callback(null, false)
    }
  })
}

MasterRedisAdaptor.prototype.getAboveSyndex = function(type, syndex, callback) {
  if(!this._store[type]) return callback(null, false)
  var outOfSyncItems = _.filter(this._store[type].items, function(item) {
    return item.syndex > syndex
  })
  callback(null, outOfSyncItems)
}

module.exports = MasterRedisAdaptor

