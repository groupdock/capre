// creates a capre 'master' connected to redis database on default redis
// port of 6379. You can also supply an options object.
var capre = require('../../index.js')()
var slave = capre.createSlave(capre) // create a slave, pass the capre master to it

exports.sync = function(appName) {
  
  User.get
}
