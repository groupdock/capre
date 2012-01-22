'use strict'

// Reference SyncAdaptor implementation for testing purposes
var _ = require('underscore')

var SyncAdaptorMock = function() {
  this.syndex = 0
  this._storage = {} // private
}

SyncAdaptorMock.prototype.register = function(type, callback) {
  if (this._storage[type]) {
    return callback(new Error('type already exists: ' + type))
  }
  this._storage[type] = {
    syndex: 0,
    items: []
  }
  return callback(null, this._storage[type].syndex)
}

SyncAdaptorMock.prototype.getTypes = function(callback) {
  callback(null, _.keys(this._storage))
}

function addItem(type, id) {
}

SyncAdaptorMock.prototype.create = function(type, id, callback) {
  if (!this._storage[type]) return callback(new Error('unknown type: ' + type))
  var syndex = ++this._storage[type].syndex
  this._storage[type].items.push({id: id, syndex: syndex})
  callback(null, syndex)
}

SyncAdaptorMock.prototype.getSyndex = function(type, id, callback) {
  // id is optional
  if (arguments.length === 2 && typeof id === 'function') {
    callback = id
    id = null
  }
  if (!this._storage[type]) return callback(new Error('unknown type: ' + type))

  if (id === null || id === undefined) {
    return callback(null, this._storage[type].syndex)
  }
  if (!this._storage[type]) {
    return callback()
  }
  var syndex = ++this._storage[type].syndex
  var found = _.find(this._storage[type].items, function(item) {
    return item.id === id
  })
  if (found) {
    return callback(null, found.syndex)
  } else {
    callback(null, null)
  }
}

// Get all ids of `type` that have syndex > supplied syndex
// return as an array of ids
//SyncAdaptorMock.prototype.sync = function(type, syndex, callback) {
  
//}


module.exports = SyncAdaptorMock
