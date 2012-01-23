'use strict'

// Reference SyncAdaptor implementation for testing purposes
var _ = require('underscore')

var Master = function(backend, callback) {
  this.backend = backend
  process.nextTick(function() {
    callback(null)
  })
}

Master.prototype._registerIfMissing = function(type, callback) {
  this.backend.register(type, callback)
}

Master.prototype.register = function(type, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  var self = this
  this.backend.register(type, function(err, registeredType) {
    if (err) return callback(err)
    if (!registeredType) return callback(new Error('type already exists: ' + type))
    return callback(null, registeredType)
  })
}

Master.prototype.getTypes = function(callback) {
  return this.backend.getTypes(callback)
}

Master.prototype.insert = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  var self = this
  this._registerIfMissing(type, function(err) {
    if (err) return callback(err)
    self.backend.find(type, id, function(err, found) {
      if (found) return callback(new Error('inserting on duplicate id:' + inserted))
      self.backend.bumpSyndex(type, function(err, syndex) {
        if (err) return callback(err)
        self.backend.insert(type, id, syndex, function(err, inserted) {
          if (err) return callback(err)
          if (!inserted) return callback(new Error('there was a problem inserting.'))
          callback(null, inserted)
        })
      })
    })
  })
}

Master.prototype.update = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  this.backend.isRegistered(type, (function(err, isRegistered) {
    if (err) return callback(err)
    if (!isRegistered) return callback(new Error('unknown type: ' + type))
    this.backend.bumpSyndex(type, (function(err, syndex) {
      this.backend.update(type, id, syndex, function(err, updated) {
        if (err) return callback(err)
        if (!updated) return callback(new Error('item not found'))

        return callback(null, updated)
      })
    }).bind(this))
  }).bind(this))
}

Master.prototype.upsert = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  var self = this
  this._registerIfMissing(type, function() {
    self.backend.bumpSyndex(type, function(err, syndex) {
      if (err) return callback(err)
      self.backend.update(type, id, syndex, function(err, updated) {
        if (err) return callback(err)
        if (!updated) return self.backend.insert(type, id, syndex, callback)
        callback(null, updated)
      })
    })
  })
}

Master.prototype.remove = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  var self = this
  this.backend.isRegistered(type, function(err, isRegistered) {
    if (err) return callback(err)
    if (!isRegistered) return callback(new Error('unknown type: ' + type))
    self.backend.find(type, id, function(err, found) {
      if (err) return callback(err)
      if (found) {
        self.backend.bumpSyndex(type, function(err, syndex) {
          self.backend.remove(type, id, syndex, function(err, removed) {
            if (err) return callback(err)
            return callback(null, removed)
          })
        })
      } else {
        return callback(new Error('item not found'))
      }
    })
  })
}

Master.prototype.get = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  if (typeof id !== 'string') id = null
  // id is optional
  var self = this
  this.backend.isRegistered(type, function(err, isRegistered) {
    if (err) return callback(err)
    if (!isRegistered) return callback(new Error('unknown type: ' + type))
    if (id === null || id === undefined) {
      return callback(null, isRegistered)
    }
    self.backend.find(type, id, function(err, found) {
      if (found) {
        return callback(null, found)
      } else {
        return callback(null, null)
      }
    })
  })
}

Master.prototype.getSyndex = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  if (typeof id !== 'string') id = null
  // id is optional
  var self = this
  this.backend.isRegistered(type, function(err, isRegistered) {
    if (err) return callback(err)
    if (!isRegistered) return callback(new Error('unknown type: ' + type))
    if (id === null || id === undefined) {
      return callback(null, isRegistered.syndex)
    }
    self.get(type, id, function(err, data) {
      if (data) {
        data = data.syndex
      }
      return callback(err, data)
    })
  })
}

// Get all ids of `type` that have syndex > supplied syndex
// return as an array of ids
Master.prototype.sync = function(type, syndex, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  var self = this
  this._registerIfMissing(type, function(err) {
    if (err) return callback(err)
    self.backend.getAboveSyndex(type, syndex, function(err, items) {
      if (err) return callback(err)
      self.get(type, function(err, typeInfo) {
        if (err) return callback(err)
        callback(null, items, typeInfo)
      })
    })
  })
}

Master.prototype.find = function(type, id, callback) {
  this.backend.find(type, id, callback)

}

module.exports = Master

