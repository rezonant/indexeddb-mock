# indexeddb-mock

> Easily stub out IndexedDB

This mock is adapted from [mock-indexeddb][1] to play nice with CommonJS and `npm`.

# Install

Use `npm`.

```shell
npm i -D indexeddb-mock
```

# Public API

##### `.mock`

A mock of the IndexedDB API.

##### `.reset()`

Resets state in the mock. Call this before tests to reset state.

##### `.commit(key, value)`

Adds an item with `key` and `value`. Used to prefill IndexedDB before tests.

##### `.flags`

You can set flags to determine what features are enabled. Here's the defaults.

```json
{
  "canOpenDB": true,
  "openDBShouldBlock": false,
  "openDBShouldAbort": false,
  "upgradeNeeded": false,
  "canReadDB": true,
  "canSave": true,
  "canDelete": true,
  "canClear": true,
  "canCreateStore": true,
  "canDeleteDB": true
}
```

Note that flags are reset to their defaults whenever `.reset()` is called.
You will find descriptions of each flag below.

## canOpenDB

If true, the mock will respond to open() requests with success generally.
If not true, the mock will "fail" to open the database.

## openDBShouldBlock

If true, the mock will respond to open() requests by blocking the application
from continuing due to incompatible versions presently running.

## openDBShouldAbort

If true, the mock will respond to open() requests by aborting the open() process,
triggering the onaborted event handler.

## upgradeNeeded

If true, the mock will respond to open() by triggering an onupgradeneeded event, before
finally triggering onsuccess.

## canReadDB

If false, the mock will respond to IDBObjectStore.openCursor() by triggering an error condition as the database
cannot be read.

## canSave

If false, the mock will respond to IDBObjectStore.put() by triggering an error condition.

## canDelete

If false, the mock will respond to IDBObjectStore.delete() by triggering an error condition.

## canClear

If false, the mock will respond to IDBObjectStore.clear() by triggering an error condition

## canCreateStore

If false, the mock will respond to IDBDatabase.createObjectStore() by triggering an error condition

## canDeleteDB

If false, the mock will respond to indexeddb.deleteDatabase() by triggering an error condition

# License

MIT

  [1]: https://github.com/szimmers/mock-indexeddb
