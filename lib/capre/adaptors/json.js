'use strict'

var _ = require('underscore')
var mkdirp = require('mkdirp')
var path = require('path')
var fs = require('fs')
var async = require('async')

var MemoryAdaptor = require('./memory')

var JSONAdaptor = function(filePath, callback) {
  this._path = filePath || path.join(__dirname, 'tmp', 'slave.json')
  var self = this
  var next = function(err) {
    if (err) return callback(err)
    self._load(callback)
  }

  if (!this._memoryAdaptor) {
    this._memoryAdaptor = new MemoryAdaptor(next)
  } else {
    next()
  }
}


//this._load = function(callback) {
  //var self = this
  //this.__load()
//}
//this.__load = function(path, destination, callback) {
  //var self = this
  //var loadData = function(path) {
    //fs.readFile(path, 'utf-8', function(err, data) {
      //try {
        //var json = JSON.parse(data)
      //} catch (e) {
        //return callback(e)
      //}
      //destination = json
      //callback(null, json)
    //})
  //}
  //path.exists(path, function(err, exists) {
    //if (!exists) {
      //mkdirp(path.dirname(path), function(err) {
        //if (err) return callback(err)
        //loadData(path)
      //})
    //} else {
      //loadData(path)
    //}
  //})
//}

JSONAdaptor.prototype._load = function(callback) {
  var self = this
  var json = {}
  async.series([
    function(next) {
      path.exists(self._path, function(exists) {
        if (exists) {
          fs.readFile(self._path, 'utf-8', function(err, data) {
            if (err) return next(err)
            try {
              json = JSON.parse(data)
            } catch (err) {
              return next(err)
            }
            next()
          })
        } else {
          next()
        }
      })
    }
  ], function(err) {
    self._memoryAdaptor._store = json
    callback(null, json)
  })
}

JSONAdaptor.prototype._save = function(callback) {
  var json = JSON.stringify(this._memoryAdaptor._store)
  fs.writeFile(this._path, json, 'utf-8', function(err) {
    if (err) return callback(err)
    callback()
  })
}

/////// Read Operations ///////

JSONAdaptor.prototype.getTypeInfo = function(type, callback) {
  var self = this
  this._memoryAdaptor.getTypeInfo.apply(this._memoryAdaptor, arguments)
}

JSONAdaptor.prototype.getTypes = function(callback) {
  var self = this
  this._memoryAdaptor.getTypes.apply(this._memoryAdaptor, arguments)
}

JSONAdaptor.prototype.getTypes = function(callback) {
  var self = this
  this._memoryAdaptor.getTypes.apply(this._memoryAdaptor, arguments)
}

JSONAdaptor.prototype.getAboveSyndex = function(type, syndex, callback) {
  var self = this
  this._memoryAdaptor.getAboveSyndex.apply(this._memoryAdaptor, arguments)
}

/////// Write Operations ///////

JSONAdaptor.prototype.flush = function(callback) {
  var self = this
  this._memoryAdaptor.flush(function(err) {
    self._save(function(saveErr) {
      if (err) return callback(err)
      if (saveErr) return callback(saveErr)
      callback()
    })
  })
}

JSONAdaptor.prototype.register = function(type, callback) {
  var self = this
  var callback = arguments[arguments.length - 1]
  this._memoryAdaptor.register(type, function(err) {
    var args = arguments
    self._save(function(saveErr) {
      if (err) return callback(err)
      if (saveErr) return callback(saveErr)
      callback.apply(self, args)
    })
  })
}

JSONAdaptor.prototype.bumpSyndex = function(type, callback) {
  var self = this
  var callback = arguments[arguments.length - 1]
  this._memoryAdaptor.bumpSyndex(type, function(err) {
    var args = arguments
    self._save(function(saveErr) {
      if (err) return callback(err)
      if (saveErr) return callback(saveErr)
      callback.apply(self, args)
    })
  })
}

JSONAdaptor.prototype.update = function(type, id, syndex, callback) {
  var self = this
  var callback = arguments[arguments.length - 1]
  this._memoryAdaptor.update(type, id, syndex, function(err) {
    var args = arguments
    self._save(function(saveErr) {
      if (err) return callback(err)
      if (saveErr) return callback(saveErr)
      callback.apply(self, args)
    })
  })
}



JSONAdaptor.prototype.insert = function(type, id, syndex, callback) {
  var self = this
  var callback = arguments[arguments.length - 1]
  this._memoryAdaptor.insert(type, id, syndex, function(err) {
    var args = arguments
    self._save(function(saveErr) {
      if (err) return callback(err)
      if (saveErr) return callback(saveErr)
      callback.apply(self, args)
    })
  })

}

JSONAdaptor.prototype.remove = function(type, id, syndex, callback) {
  var self = this
  var callback = arguments[arguments.length - 1]
  this._memoryAdaptor.remove(type, id, syndex, function(err) {
    var args = arguments
    self._save(function(saveErr) {
      if (err) return callback(err)
      if (saveErr) return callback(saveErr)
      callback.apply(self, args)
    })
  })
}

JSONAdaptor.prototype.find = function(type, id, callback) {
  var self = this
  var callback = arguments[arguments.length - 1]
  this._memoryAdaptor.find(type, id, function(err) {
    var args = arguments
    self._save(function(saveErr) {
      if (err) return callback(err)
      if (saveErr) return callback(saveErr)
      callback.apply(self, args)
    })
  })
}



module.exports = JSONAdaptor
