## Capre

Simple utility for helping you manage multiple applications that need to sync with
some master data source.

Capre is a simple redis-backed utility that allows you to keep track of changes to
a master data-set, and how far along external applications are with their syncing 
so you know exactly what records need to be sent to what application to
bring them up to date.  Capre is designed to be retrofit into existing architecture.

The primary component of any replication system is knowing what needs to change
to bring a slave system up to date. This is Capre's sole responsibility.

![How Capre fits in your architecture](https://github.com/groupdock/capre/raw/master/sync-sequence.png)

Capre doesn't care what data you're replicating, or how you want to
handle transferring the actual data. Capre solely keeps track of
unique identifiers and which of them were changed since your last sync.


## Capre Master

The Capre Master tracks what items change in your data set.

```js
var capre = require('capre')
// Create a capre 'master' connected to redis database on default redis
// port of 6379. You can also supply an options object containing host,
// port and any other redis options you want to specify
var master = capre.createMaster() 
```

## Capre Slave

Slaves keep track of what position an external application is up to in the sync process. Slaves and Masters exist on the same machine.

```js
// create a capre 'slave', passing the capre master to slave to
var slave = capre.createSlave(master)
```

## Syncing

To sync, simply call slave.sync with the name of the application you
want to sync, along with the 'type'. This will give you a list of unique
identifiers that changed since the last sync. You can now pull these ids
down from whatever DB you're using and send them to slave app.
```js
slave.sync('my-application', 'User', function(err, userIds) {
  // get the ids from your DB  (e.g. *SQL, mongo)
  DB.find('User', userIds, function(err, users) {
    // users now contains all the users that changed since last syncing
  })
})
```

Typically, you'd place the sync method behind some kind of remote API,
such as an http service or sockets, or you could even push changes.
Capre is simple enough that it gives you the flexibility to easily
 implement these connectivity layers as you see fit.

## Marking items as changed

To know which items need to be synced, you simply need to `mark` them
after modifying them. Typically you'd do this in some kind of pre/post
save hook or callback.

```js

// users might be created on a form POST operation
app.post('user/new', function(req, res, next) {
  var newUser = {
    name: req.params.name // NOTE: make sure you sanitise your inputs!
    address: req.params.address
  }
  // Save user in our pretend database
  DB.save('User', newUser, function(err, savedUser) {
    if (err) return next(err)
    // assume saving an item produces an id
    // mark user in capre master for type 'User'
    master.mark('User', savedUser.id, function(err) {
      if (err) return next(err)
      return res.send(200) // Success!
    })
  })
}

```

## Types
Track multiple types in capre by simply using a String to specify
different types when you're either marking or syncing.

```js
master.mark('Posts', post, function() {
  // etc
})

// You can use unique identifiers as part of your 'type' to
// gain more fine grained marking/syncing

// mark post by a user
master.mark('Posts:' + user.id, post, function() {
  // etc
})

// Sync posts by a user
slave.sync('blog-application', 'Posts:' + user.id, function(err, userPostIds) {
  assert.ifError(err)
  // userPostIds contains a list of all posts by a user that changed.
})
```

## Flushing

Reset either the entire master or a single slave by calling `flush`.

```js
master.flush() // flushes all data from this master and slaves
slave.flush() // flushes all data from the current slave
```

###TODO

* API Docs
* Examples

### What is 'Capre'

It means 'Goats' in Latin. Goats. 
