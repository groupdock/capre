'use strict'

var assert = require('assert')

var uuid = require('shortid')
var async = require('async')
var _ = require('underscore')

exports.generateItems = function(master) {
  return function(type, count, doMark, callback) {
    if (typeof doMark === 'function') {
      callback = doMark
      doMark = true
    }
    var number = _.range(count)
    async.mapSeries(number, function(item, next) {
      var id = uuid()
      if (doMark) {
        master.mark(type, id, function(err) {
          next(err, id)
        })
      } else {
        next(null, id)
      }
    }, function(err, items) {
      assert.ifError(err)
      callback(err, items)
    })
  }
}
