var util = require('util')
var _ = require('underscore')

var Base = require('./base')

// both arguments are optional. 
var Master = function(backend, options) {
  Master.super_.apply(this, arguments)
}

util.inherits(Master, Base)

module.exports = Master

