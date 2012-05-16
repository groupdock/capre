#!/usr/bin/env node
'use strict'

var Faker = require('Faker')
var assert = require('assert')
var program = require('commander');
var restify = require('restify')
var capre = require('../../index.js')

var User = require('./user_model')


// Create a capre 'master' connected to redis database on default redis
// port of 6379. You can also supply an options object containing host,
// port and any other redis options you want to specify.
var master = capre.createMaster()

// create a slave, passing the capre master to connect to
var slave = capre.createSlave(master)

// Enable helpful debugging ouput messages
master.debug = true

// Whenever a user is saved, mark them as modified.
User.on('saved', function(user) {
  // Mark user in capre master
  master.mark('Users', user.id, function(err) {
    assert.ifError(err)
  })
})

// Server Config
var server = restify.createServer()

// Request handler for sync
var sync = function(req, res) {
  // Will sync Users for an app designated by params.AppName
  slave.sync(req.params.appName, 'Users', req.params.syndex, function(err, ids) {
    res.send(User.find(ids))
  })
  console.info('Syncing ', req.params.appName)
}

// Routes
server.get('/:appName/sync/:syndex', sync)
server.get('/:appName/sync/', sync)

// Helper method. creates new Users for syncing
var addUser = function(name) {
  var user = User.create({name: name || Faker.Name.findName()})
  user.save()
  return user
}

// flush db on startup
master.flush(function() {})

// recursive prompt
var prompt = function() {
  program.prompt('\nPress Enter to create a new user.', function(name){
    console.log('Added: ', addUser(name))
    prompt()
  });
}

console.log('Server listening on port 9000')
server.listen(9000)

prompt()

