#!/usr/bin/env node
'use strict'

var assert = require('assert')
var program = require('commander');
var restify = require('restify')

var APP_NAME = 'secondary-app'

var client = restify.createJsonClient({
  url: 'http://localhost:9000',
  version: '*'
})

var User = require('./user_model')

program
  .parse(process.argv);

var db = {}

// always reset on first run
var firstRun = true

var prompt = function() {
  program.prompt('\nPres Enter to Sync.', function(val){
    firstRun = false
    if (/^[0-9]+$/.test(val)) {
      val = parseInt(val)
    } else if (val === 'R' || firstRun) {
      val = 0
    } else {
      val = undefined
    }

    var url = '/'+ APP_NAME + '/sync/' + (val ? val : '')
    console.log('Syncing on', url)
    client.get(url, function(err, req, res, body) {
      if (err) {
        console.error(err.message)
        prompt()
        return
      }
      var users = body
      users.forEach(function(userData) {
        var user = User.create(userData)
        user.save()
        console.info('Synced: ', user)
      })
      if (!users.length) {
        console.info('Nothing to sync')
      }
      assert.ifError(err)
      prompt()
    })
  })
}
prompt()
