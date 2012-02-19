'use strict'

var util = require('util')

// Reference SyncAdaptor implementation for testing purposes
var _ = require('underscore')

var Capre = function(backend, callback) {
  this.backend = backend
  process.nextTick(function() {
    callback(null)
  })
}

Capre.prototype._registerIfMissing = function(type, callback) {
  var self = this
  this.backend.getTypeInfo(type, function(err, typeInfo) {
    if (typeInfo) return callback(null, typeInfo)

    self.backend.register(type, function(err, registeredType) {
      if (err) return callback(err)
      return callback(null, registeredType)
    })
  })
}

Capre.prototype.register = function(type, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  var self = this
  this.backend.getTypeInfo(type, function(err, typeInfo) {
    if (err) return callback(err)
    if (typeInfo) return callback(new Error('type already exists: ' + typeInfo.type))

    self.backend.register(type, function(err, registeredType) {
      if (err) return callback(err)
      return callback(null, registeredType)
    })
  })
}

Capre.prototype.getTypes = function(callback) {
  return this.backend.getTypes(callback)
}

Capre.prototype.insert = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  var self = this
  this._registerIfMissing(type, function(err) {
    if (err) return callback(err)
    self.find(type, id, function(err, found) {
      if (err) return callback(err)
      if (found) return callback(new Error('inserting on duplicate id:' + util.inspect(found)))
      self.bumpSyndex(type, function(err, syndex) {
        if (err) return callback(err)

        syndex = parseInt(syndex)
        if (id instanceof Array) {
          self.backend.insertMany(type, id, syndex, function(err, inserted) {
            if (err) return callback(err)
            if (!inserted) return callback(new Error('there was a problem inserting.'))
            callback(null, inserted)
          })
        } else {
          self.backend.insert(type, id, syndex, function(err, inserted) {
            if (err) return callback(err)
            if (!inserted) return callback(new Error('there was a problem inserting.'))
            callback(null, inserted)
          })
        }
      })
    })
  })
}

Capre.prototype.update = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  var self = this
  this.backend.getTypeInfo(type, function(err, typeInfo) {
    if (err) return callback(err)
    if (!typeInfo) return callback(new Error('unknown type: ' + type))
    self.find(type, id, function(err, found) {
      if (err) return callback(err)
      if (!found) return callback(new Error('item not found'))

      self.bumpSyndex(type, function(err, syndex) {
        if (err) return callback(err)
        self.backend.update(type, id, syndex, function(err, updated) {
          if (err) return callback(err)
          return callback(null, updated)
        })
      })
    })
  })
}

Capre.prototype.upsert = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  var self = this
  this._registerIfMissing(type, function(err, typeInfo) {
    if (err) return callback(err)
    self.bumpSyndex(type, function(err, syndex) {
      if (err) return callback(err)
      self.backend.update(type, id, syndex, function(err, updated) {
        if (err) return callback(err)
        if (!updated) return self.backend.insert(type, id, syndex, callback)
        callback(null, updated)
      })
    })
  })
}

Capre.prototype.remove = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))

  var self = this
  this.backend.getTypeInfo(type, function(err, typeInfo) {
    if (err) return callback(err)
    if (!typeInfo) return callback(new Error('unknown type: ' + type))
    self.backend.find(type, id, function(err, found) {
      if (err) return callback(err)
      if (found) {
        self.bumpSyndex(type, function(err, syndex) {
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

Capre.prototype.get = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  if (typeof id !== 'string') id = null
  // id is optional
  var self = this
  this.backend.getTypeInfo(type, function(err, typeInfo) {
    if (err) return callback(err)
    if (!typeInfo) return callback(new Error('unknown type: ' + type))
    if (id === null || id === undefined) {
      return callback(null, typeInfo)
    }
    self.backend.find(type, id, function(err, found) {
      if (err) return callback(err)
      if (found) {
        return callback(null, found)
      } else {
        return callback(null, null)
      }
    })
  })
}

Capre.prototype.getSyndex = function(type, id, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof id === 'function') id = null
  if (typeof type !== 'string') return callback(new Error('type required'))
  var args = []
  args.push(type)
  id != null && args.push(id)
  args.push(function(err, data) {
    if (data) {
      data = parseInt(data.syndex)
    }
    return callback(err, data)
  })
  this.get.apply(this, args)
}

Capre.prototype.setSyndex = function(type, syndex, callback) {
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  var self = this
  syndex = parseInt(syndex)
  this.backend.getTypeInfo(type, function(err, typeInfo) {
    if (err) return callback(err)
    if (!typeInfo) return callback(new Error('unknown type: ' + type))
    if (syndex < typeInfo.syndex) return callback(new Error('Cannot set syndex to lower value! current:'+typeInfo.syndex+' new:' + syndex))
    return self.backend.setSyndex(type, syndex, callback)
  })
}

Capre.prototype.bumpSyndex = function(type, callback) {
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  var self = this
  this.backend.getTypeInfo(type, function(err, typeInfo) {
    if (err) return callback(err)
    if (!typeInfo) return callback(new Error('unknown type: ' + type))
    return self.backend.bumpSyndex(type, function(err, syndex) {
      callback(err, parseInt(syndex))
    })
  })
}

// Get all ids of `type` that have syndex > supplied syndex
// return as an array of ids
Capre.prototype.sync = function(type, syndex, callback) {
  var callback = (typeof arguments[arguments.length - 1] === 'function') ? arguments[arguments.length - 1] : function() {}
  if (typeof type !== 'string') return callback(new Error('type is required: ' + type))
  syndex = parseInt(syndex)
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

Capre.prototype.find = function(type, id, callback) {
  if (id instanceof Array) {
    this.backend.findMany(type, id, callback)
  } else {
    this.backend.find(type, id, callback)
  }
}

Capre.prototype.flush = function(callback) {
  this.backend.flush(callback)
}

module.exports = Capre
