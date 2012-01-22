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
  process.nextTick((function() {
    if (!this._storage[type]) {
      var typeData = {
        type: type,
        syndex: 0,
        items: []
      }

      this._storage[type] = typeData
      callback(null, typeData)
    } else {
      callback(null, false)
    }
  }).bind(this))
}

module.exports = MasterMemoryAdaptor
