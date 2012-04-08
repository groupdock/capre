'use strict'

// Track changes to a type

var capre = require('../')
var Slave = capre.Slave
var mongoose = require('mongoose')
var loadInitialData = function() {

}

var master, slave

exports.master = capre.createMaster()
exports.slave = new Slave(exports.master)

module.exports = function(schema, options) {
  schema.post('save', function(item) {
    exports.master._mark(this.constructor.modelName, String(item._id), function(err) {
      if (err) return console.error('Error Marking after Saving', 'err: ', err, 'item: ', item)
    })
  })
  schema.post('remove', function(item) {
    exports.master._mark(this.constructor.modelName, String(item._id), function(err) {
      if (err) return console.error('Error Marking after Removing', 'err: ', err, 'item: ', item)
    })
  })
}
module.exports.sync = function(name, type, callback) {
  exports.slave.sync(name, type, function(err, ids, syndex) {
    if (err) return callback(err)
    mongoose.models[type].where('_id').in(ids).exec(function(err, items) {
      if (err) return callback(err)
      callback(null, {
        items: items,
        syndex: syndex
      })
    })
  })
}
