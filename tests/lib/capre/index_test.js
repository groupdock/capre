var CapreRedisAdaptor = require('../../../lib/capre/adaptors/redis')
var CapreMemoryAdaptor = require('../../../lib/capre/adaptors/memory')

var shared = require('./adaptors_test')

describe('capre', function() {
  describe('memory adaptor', function() {
    before(function(){
      this.backend = CapreMemoryAdaptor
    })
    shared.shouldBehaveLikeACapreAdaptor()
  })
  describe('redis adaptor', function() {
    before(function(){
      this.backend = CapreRedisAdaptor
    })
    shared.shouldBehaveLikeACapreAdaptor()
  })
})
