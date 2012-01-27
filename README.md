## Capre

Ultra-Simple utility to facilitate data replication.

Capre doesn't care what data you're replicating, or how you want to
handle transferring the actual data, it solely keeps track of
what unique identifiers changed between two points in time.

### Motivation

Capre exists to facilitate data replication across the many disparate systems 
one might find in business environments and where syncronisation latency
is not a priority.

The primary component of any replication system is knowing what needs to change
to bring a slave system up to date. This is Capre's sole responsibility.

You tell Capre something changed, and it will notify (via push or pull)
any connected slaves that particular something changed. It is now up to
the host and client implementing capre to actually facilitate any data
exchange.

A typical exchange might go like so:

Two business systems, one is connected to HR's primary user
input mechanism. This system runs the capre server and becomes the 'master'.
Each time a change is made in the HR system

Another system wants to access the master's User data, it becomes the
'slave'.asks to
sync with it. Since the master has not seen this slave before, it will
send down the ids of every current User in the system. The slave can
then use these ids to query the master application for the actual data.

Later, some new users are created in the HR system, and these ids are
marked as changed in Capre. The next time the slave system connects to
the master, the slave exchanges the 


In any system,

##Usage

Start a capre server from command prompt (default backend is redis):

```
> capre 
Running new Capre server on port: 3000
Using redis adaptor.
```

Create a new master in your application:

```
var Master = require('capre').master

// tell capre what port to connect on and what type we want to use
var userMaster = new Master(3000).use('User')

userMaster.on('ready', function() {
  // ready to go
})

// ...in User model:

// Capre keeps a global cache of types
var userMaster = require('capre').type.User.master

User.post('save', function() {
  // tell capre there's a new/updated user
  userMaster.mark(user.id)
})


```


### What is 'Capre'

It means 'Goats' in Latin. Goats. 