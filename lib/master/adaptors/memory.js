'use strict'

var _ = require('underscore')

var MasterMemoryAdaptor = function() {
  this._store = Object.create(null) // private
}

MasterMemoryAdaptor.prototype.isRegistered = function(type, callback) {
  var self = this
  process.nextTick(function() {
    if (self._store[type]) {
      callback(null, self._store[type])
    } else {
      callback(null, false)
    }
  })
}

MasterMemoryAdaptor.prototype.register = function(type, callback) {
  var self = this
  process.nextTick((function() {
    if (!self._store[type]) {
      var typeData = {
        type: type,
        syndex: 0,
        items: []
      }
      self._store[type] = typeData
      callback(null, typeData)
    } else {
      callback(null, false)
    }
  }))
}

MasterMemoryAdaptor.prototype.getTypes = function(callback) {
  var self = this
  process.nextTick(function() {
    return callback(null, _.keys(self._store))
  })
}


MasterMemoryAdaptor.prototype.update = function(type, id, syndex, callback) {
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

MasterMemoryAdaptor.prototype.bumpSyndex = function(type, callback) {
  var self = this
  process.nextTick(function() {
    if (!self._store[type]) return callback(null, null)

    self._store[type].syndex++
    return callback(null, self._store[type].syndex)
  })
}

MasterMemoryAdaptor.prototype.insert = function(type, id, syndex, callback) {
  var self = this
  if(!this._store[type]) return callback(null, false)
  this.find(type, id, function(err, found) {
    if (err) return callback(err)
    if (found) return callback(null, false)
    var item = {id: id, syndex: syndex, op: 'insert'}
    self._store[type].items.push(item)
    return callback(null, item)
  })
}

MasterMemoryAdaptor.prototype.remove = function(type, id, syndex, callback) {
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

MasterMemoryAdaptor.prototype.find = function(type, id, callback) {
  if(!this._store[type]) return callback(null, false)
  var found = _.find(this._store[type].items, function(item) {
    return item.id === id
  })
  return callback(null, found)
}

MasterMemoryAdaptor.prototype.getAboveSyndex = function(type, syndex, callback) {
  if(!this._store[type]) return callback(null, false)
  var outOfSyncItems = _.filter(this._store[type].items, function(item) {
    return item.syndex > syndex
  })
  callback(null, outOfSyncItems)
}

module.exports = MasterMemoryAdaptor
