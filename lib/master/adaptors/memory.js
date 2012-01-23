var _ = require('underscore')

var MasterMemoryAdaptor = function() {
  this._storage = Object.create(null) // private
}

MasterMemoryAdaptor.prototype.isRegistered = function(type, callback) {
  process.nextTick((function() {
    if (this._storage[type]) {
      callback(null, true)
    } else {
      callback(null, false)
    }
  }).bind(this))
}

MasterMemoryAdaptor.prototype.register = function(type, callback) {
  var self = this
  process.nextTick((function() {
    if (!self._storage[type]) {
      var typeData = {
        type: type,
        syndex: 0,
        items: []
      }

      self._storage[type] = typeData
      callback(null, typeData)
    } else {
      callback(null, false)
    }
  }))
}

MasterMemoryAdaptor.prototype.getTypes = function(callback) {
  process.nextTick((function() {
    return callback(null, _.keys(this._storage))
  }).bind(this))
}


MasterMemoryAdaptor.prototype.update = function(type, id, callback) {
  this.find(type, id, function(err, found) {
    if (err) return callback(err)
    if (found) {
      found.syndex++
      found.op = 'update'
      return callback(null, found)
    } else {
      return callback(null, false)
    }
  })
}

MasterMemoryAdaptor.prototype.find = function(type, id, callback) {
  if(!this._storage[type]) return callback(null, false)
  var found = _.find(this._storage[type].items, function(item) {
    return item.id === id
  })
  return callback(null, found)
}

module.exports = MasterMemoryAdaptor
