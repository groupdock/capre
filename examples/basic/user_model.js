// creates a capre 'master' connected to redis database on default redis
// port of 6379. You can also supply an options object.
var capre = require('../../index.js')()

// pretend db
var db = []

// Generic User Model
var User = function(name) {
  this.id = require('shortid')()
  this.name = name
}

User.prototype.save = function() {
  // save user to db (e.g. mysql) here
  db[id] = this
  // Mark user in capre
  capre.mark('User', this.id)
}

User.find = function(id) {
  return db[id]
}

module.exports = User
