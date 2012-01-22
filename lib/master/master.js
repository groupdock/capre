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

Master.prototype.find = function(type, id) {
  return _.find(this.backend._storage[type].items, function(item) {
    return item.id === id
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

Master.prototype._registerIfMissing = function(type, callback) {
  if (!this.backend._storage[type]) {
    this.register(type, callback.bind(this))
  } else {
    callback.bind(this)()
  }
}

Master.prototype.insert = function(type, id, callback) {
  this._registerIfMissing(type, function() {
    var found = this.find(type, id)
    if (found) return callback(new Error('inserting on duplicate id:' + found))
    var syndex = ++this.backend._storage[type].syndex
    var item = {id: id, syndex: syndex, op: 'insert'}
    this.backend._storage[type].items.push(item)
    callback(null, item)
  })
}

Master.prototype.update = function(type, id, callback) {
  if (!this.backend._storage[type]) return callback(new Error('unknown type: ' + type))
  var found = this.find(type, id)
  if (found) {
    found.syndex++
    found.op = 'update'
    return callback(null, found)
  } else {
    return callback(new Error('item not found'))
  }
}

Master.prototype.upsert = function(type, id, callback) {
  this._registerIfMissing(type, function() {
    var found = this.find(type, id)
    if (found) {
      return this.update(type, id, callback)
    } else {
      return this.insert(type, id, callback)
    }
  })
}
Master.prototype.remove = function(type, id, callback) {
  if (!this.backend._storage[type]) return callback(new Error('unknown type: ' + type))
  var found = this.find(type, id)
  if (found) {
    found.syndex++
    found.op = 'remove'
    return callback(null, found)
  } else {
    return callback(new Error('item not found'))
  }
}

Master.prototype.get = function(type, id, callback) {
  if (!this.backend._storage[type]) return callback(new Error('unknown type: ' + type))
  var found = this.find(type, id)
  if (found) {
    return callback(null, found)
  } else {
    callback(null, null)
  }
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
    callback(err, data)
  })
}

// Get all ids of `type` that have syndex > supplied syndex
// return as an array of ids
Master.prototype.sync = function(type, syndex, callback) {
  this._registerIfMissing(type, function() {
    var outOfSyncItems = _.filter(this.backend._storage[type].items, function(item) {
      return item.syndex > syndex
    })
    var outOfSyncIds = _.pluck(outOfSyncItems, 'id')
    callback(null, outOfSyncIds, this.backend._storage[type].syndex)
  })
}

module.exports = Master

