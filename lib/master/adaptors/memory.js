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

module.exports = MasterMemoryAdaptor
