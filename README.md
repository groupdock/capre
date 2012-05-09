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

###TODO

* API Docs
* Examples

### What is 'Capre'

It means 'Goats' in Latin. Goats. 
