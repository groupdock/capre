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
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  this._registerIfMissing(type, (function(err) {
    if (err) return callback(err)
    this.backend.bumpSyndex(type, (function(err, syndex) {
      if (err) return callback(err)
      this.backend.insert(type, id, syndex, (function(err, inserted) {
        if (err) return callback(err)
        if (!inserted) return callback(new Error('inserting on duplicate id:' + inserted))
        callback(null, inserted)
      }).bind(this))
    }).bind(this))
  }).bind(this))
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

  this._registerIfMissing(type, (function() {
    this.backend.bumpSyndex(type, (function(err, syndex) {
      if (err) return callback(err)
      this.backend.update(type, id, syndex, (function(err, updated) {
        if (err) return callback(err)
        if (!updated) return this.backend.insert(type, id, syndex, callback)
        callback(null, updated)
      }).bind(this))
    }).bind(this))
  }).bind(this))
}

Master.prototype.remove = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  this.backend.isRegistered(type, (function(err, isRegistered) {
    if (err) return callback(err)
    if (!isRegistered) return callback(new Error('unknown type: ' + type))
    this.backend.find(type, id, (function(err, found) {
      if (err) return callback(err)
      if (found) {
        this.backend.bumpSyndex(type, (function(err, syndex) {
          this.backend.remove(type, id, syndex, function(err, removed) {
            if (err) return callback(err)
            return callback(null, removed)
          })
        }).bind(this))
      } else {
        return callback(new Error('item not found'))
      }
    }).bind(this))
  }).bind(this))
}

Master.prototype.get = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  if (typeof id !== 'string') id = null
  // id is optional

  this.backend.isRegistered(type, (function(err, isRegistered) {
    if (err) return callback(err)
    if (!isRegistered) return callback(new Error('unknown type: ' + type))
    if (id === null || id === undefined) {
      return callback(null, isRegistered)
    }
    this.backend.find(type, id, function(err, found) {
      if (found) {
        return callback(null, found)
      } else {
        return callback(null, null)
      }
    })
  }).bind(this))
}

Master.prototype.getSyndex = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  if (typeof id !== 'string') id = null
  // id is optional
  
  this.backend.isRegistered(type, (function(err, isRegistered) {
    if (err) return callback(err)
    if (!isRegistered) return callback(new Error('unknown type: ' + type))
    if (id === null || id === undefined) {
      return callback(null, isRegistered.syndex)
    }
    this.get(type, id, function(err, data) {
      if (data) {
        data = data.syndex
      }
      return callback(err, data)
    })
  }).bind(this))
}

// Get all ids of `type` that have syndex > supplied syndex
// return as an array of ids
Master.prototype.sync = function(type, syndex, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  this._registerIfMissing(type, (function(err) {
    if (err) return callback(err)
    this.backend.getAboveSyndex(type, syndex, (function(err, items) {
      if (err) return callback(err)
      this.get(type, function(err, typeInfo) {
        if (err) return callback(err)
        callback(null, items, typeInfo)
      })
    }).bind(this))
  }).bind(this))
}

module.exports = Master

