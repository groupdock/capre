var dnode = require('dnode')
var sinon = require('sinon')

var assert = require('assert')

var Server = require('../lib/server')

describe('server', function() {
  it('should listen on a port', function(done) {
    var PORT = 4000
    var dnodeInstance = dnode()
    var listenStub = sinon.stub(dnodeInstance, "listen", function() {
      console.log(arguments)
      dnodeInstance.emit('ready')
    })
    var server = new Server(PORT, function() {
      assert.ok(listenStub.withArgs(PORT))
      done()
    })
    server.dnode = dnodeInstance
  })
})
