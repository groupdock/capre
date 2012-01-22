var PORT = 5000

var Master = require('../lib/master')
var Slave = require('../lib/slave')

var assert = require('assert')

describe('getting sync', function() {
  var master, slave
  before(function(done) {
    master = new Master(PORT, function() {
      slave = new Slave(PORT, function() {
        done()
      })
    })
  })
  it('can register a resource type', function(done) {
    var typeName = 'some type'
    slave.register(typeName, function() {

    })
  })
  it('can get sync num', function(done) {
    slave.getSyndex(function(err, syndex) {
      assert.ok(!err)
      assert.equal(0, syndex)
      done()
    })
  })

})
