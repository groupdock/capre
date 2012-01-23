'use strict'

// Reference SyncAdaptor implementation for testing purposes
var _ = require('underscore')

var Master = function(backend, callback) {
  this.backend = backend
  this._storage = Object.create(null) // private
  process.nextTick(function() {
    callback(null)
  })
}

Master.prototype._registerIfMissing = function(type, callback) {
  this.backend.register(type, function() {
    callback(null)
  })
}

Master.prototype.register = function(type, callback) {
  this.backend.register(type, (function(err, registeredType) {
    if (err) return callback(err)
    if (!registeredType) return callback(new Error('type already exists: ' + type))

    return callback(null, registeredType)
  }).bind(this))
}

Master.prototype.getTypes = function(callback) {
  return this.backend.getTypes(callback)
}

Master.prototype.insert = function(type, id, callback) {
  this._registerIfMissing(type, (function() {
    this.backend.find(type, id, (function(err, found) {
      if (err) return callback(err)
      if (found) return callback(new Error('inserting on duplicate id:' + found))
      var syndex = ++this.backend._storage[type].syndex
      var item = {id: id, syndex: syndex, op: 'insert'}
      this.backend._storage[type].items.push(item)
      callback(null, item)
    }).bind(this))
  }).bind(this))
}

Master.prototype.update = function(type, id, callback) {
  this.backend.isRegistered(type, (function(err, isRegistered) {
    if (err) return callback(err)
    if (!isRegistered) return callback(new Error('unknown type: ' + type))
    this.backend.update(type, id, function(err, updated) {
      if (err) return callback(err)
      if (!updated) return callback(new Error('item not found'))

      return callback(null, updated)
    })
  }).bind(this))
}

Master.prototype.upsert = function(type, id, callback) {
  this._registerIfMissing(type, (function() {
    this.backend.update(type, id, (function(err, updated) {
      if (err) return callback(err)
      if (!updated) return this.insert(type, id, callback)
      callback(null, updated)
    }).bind(this))
  }).bind(this))
}

Master.prototype.remove = function(type, id, callback) {
  if (!this.backend._storage[type]) return callback(new Error('unknown type: ' + type))
  var found = this.backend.find(type, id, function(err, found) {
    if (err) return callback(err)
    if (found) {
      found.syndex++
      found.op = 'remove'
      return callback(null, found)
    } else {
      return callback(new Error('item not found'))
    }
  })
}

Master.prototype.get = function(type, id, callback) {
  if (!this.backend._storage[type]) return callback(new Error('unknown type: ' + type))
  var found = this.backend.find(type, id, function(err, found) {
    if (found) {
      return callback(null, found)
    } else {
      return callback(null, null)
    }
  })
}

Master.prototype.getSyndex = function(type, id, callback) {
  // id is optional
  if (arguments.length === 2 && typeof id === 'function') {
    callback = id
    id = null
  }
  if (!this.backend._storage[type]) return callback(new Error('unknown type: ' + type))

  if (id === null || id === undefined) {
    return callback(null, this.backend._storage[type].syndex)
  }
  this.get(type, id, function(err, data) {
    if (data) {
      data = data.syndex
    }
    return callback(err, data)
  })
}

// Get all ids of `type` that have syndex > supplied syndex
// return as an array of ids
Master.prototype.sync = function(type, syndex, callback) {
  this._registerIfMissing(type, (function() {
    var outOfSyncItems = _.filter(this.backend._storage[type].items, function(item) {
      return item.syndex > syndex
    })
    var outOfSyncIds = _.pluck(outOfSyncItems, 'id')
    callback(null, outOfSyncIds, this.backend._storage[type].syndex)
  }).bind(this))
}

module.exports = Master

