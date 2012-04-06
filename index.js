var redis = require('redis')

var Master = require('./lib/master')
var Slave = require('./lib/slave')

exports.Master = Master
exports.Slave = Slave

exports._connect = function(options) {
  options = options || {}
  var port = options.port
  var host = options.host
  delete options.port
  delete options.host
  return redis.createClient(port, host, options)
}

exports.createMaster = function(options) {
  var client = exports._connect(options)
  return new Master(client)
}

exports.createSlave = function(master) {
  var options = master
  if (!(master instanceof Master)) master = exports.createMaster(options)
  return new Slave(master)
}
