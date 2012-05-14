'use strict'

var _ = require('underscore')
var EventEmitter = require('events').EventEmitter
var util = require('util')

var User = new EventEmitter()

// pretend db
User.db = {}

// Generic User Model
var UserModel = function(options) {
  this.id = options.id || require('shortid')()
  this.name = options.name
  if (!this.name) throw new Error('User requires a name')
}

UserModel.prototype.save = function() {
  var User = require('./user_model')
  // save user to db (e.g. mysql) here
  User.db[this.id] = this
  User.emit('saved', this)
}

User.create = function(userData) {
  return new UserModel(userData)
}

User.find = function(ids) {
  if (!ids.length) return []
  return ids.map(function(id) {
    return User.db[id]
  })
}

module.exports = User
