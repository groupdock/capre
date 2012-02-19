'use strict'

var _ = require('underscore')

var MemoryAdaptor = function(options, callback) {
  var self = this
  if (arguments.length === 1 && typeof options === 'function') {
    callback = options
    options = {}
  }
  this._store = Object.create(null) // private
  process.nextTick(function() {
    callback()
  })
}

MemoryAdaptor.prototype.getTypeInfo = function(type, callback) {
  var self = this
  process.nextTick(function() {
    if (self._store[type]) {
      callback(null, self._store[type])
    } else {
      callback(null, false)
    }
  })
}

MemoryAdaptor.prototype.register = function(type, callback) {
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

MemoryAdaptor.prototype.getTypes = function(callback) {
  var self = this
  process.nextTick(function() {
    return callback(null, _.keys(self._store))
  })
}

MemoryAdaptor.prototype.bumpSyndex = function(type, callback) {
  var self = this
  process.nextTick(function() {
    if (!self._store[type]) return callback(null, null)

    self._store[type].syndex = parseInt(self._store[type].syndex) + 1
    
    return callback(null, self._store[type].syndex)
  })
}

MemoryAdaptor.prototype.setSyndex = function(type, syndex, callback) {
  var self = this
  process.nextTick(function() {
    if (!self._store[type]) return callback(null, null)

    self._store[type].syndex = syndex
    return callback(null, self._store[type].syndex)
  })
}

MemoryAdaptor.prototype.insert = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}
MemoryAdaptor.prototype.insertMany = function(type, id, syndex, callback) {
  return this._markMany.apply(this, arguments)
}

MemoryAdaptor.prototype.update = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}
MemoryAdaptor.prototype.updateMany = function(type, id, syndex, callback) {
  return this._markMany.apply(this, arguments)
}

MemoryAdaptor.prototype.remove = function(type, id, syndex, callback) {
  return this._mark.apply(this, arguments)
}
MemoryAdaptor.prototype.removeMany = function(type, id, syndex, callback) {
  return this._markMany.apply(this, arguments)
}

MemoryAdaptor.prototype._mark =  function(type, id, syndex, callback) {
  var self = this
  if(!this._store[type]) return callback(null, false)
  var item = {id: id, syndex: syndex}
  self._store[type].items.push(item)
  return callback(null, item)
}

MemoryAdaptor.prototype._markMany = function(type, ids, syndex, callback) {
  var self = this
  if(!this._store[type]) return callback(null, false)
  var items = []
  ids.forEach(function(id) {
    var item = {id: id, syndex: syndex}
    self._store[type].items.push(item)
    items.push(item)
  })
  return callback(null, items)
}

MemoryAdaptor.prototype.find = function(type, id, callback) {
  if(!this._store[type]) return callback(null, false)
  var foundItems = _.filter(this._store[type].items, function(item) {
    return item.id == id
  })
  var maxItem = _.max(foundItems, function(item) {
    return item.syndex
  })
  if (!maxItem) maxItem = null
  return callback(null, maxItem)
}

MemoryAdaptor.prototype.findMany = function(type, ids, callback) {
  if(!this._store[type]) return callback(null, false)
  var found = _.map(this._store[type].items, function(item) {
    return _.include(ids, item.id) && item
  })
  if (!found.length) found = null
  return callback(null, found)
}


MemoryAdaptor.prototype.getAboveSyndex = function(type, syndex, callback) {
  if(!this._store[type]) return callback(null, false)
  var outOfSyncItems = _.filter(this._store[type].items, function(item) {
    return item.syndex > syndex
  })
  callback(null, _.pluck(outOfSyncItems, 'id'))
}

MemoryAdaptor.prototype.flush = function(callback) {
  this._store = Object.create(null)
  callback()
}

module.exports = MemoryAdaptor
