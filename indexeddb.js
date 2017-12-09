'use strict';

// mock saves objects here
var mockIndexedDBItems = [];
var lodash = require('lodash');

// used for waitFor()'s in tests
var mockIndexedDB_openDBSuccess = false;
var mockIndexedDB_openDBFail = false;
var mockIndexedDB_openDBAbort = false;
var mockIndexedDB_openDBBlocked = false;
var mockIndexedDB_openDBUpgradeNeeded = false;

var mockIndexedDB_openCursorSuccess = false;
var mockIndexedDB_openCursorFail = false;
var mockIndexedDB_cursorReadingDone = false;

var mockIndexedDB_saveSuccess = false;
var mockIndexedDB_saveFail = false;
var mockIndexedDB_deleteSuccess = false;
var mockIndexedDB_deleteFail = false;
var mockIndexedDB_clearSuccess = false;
var mockIndexedDB_clearFail = false;
var mockIndexedDB_createStoreSuccess = false;
var mockIndexedDB_createStoreFail = false;
var mockIndexedDB_deleteDBSuccess = false;
var mockIndexedDB_deleteDBFail = false;

// used for reading objects
var mockIndexedDB_cursorResultsIndex = 0;

// test flags
var mockIndexedDBTestFlags = {
	canOpenDB: true,
	openDBShouldBlock: false,
	openDBShouldAbort: false,
	upgradeNeeded: false,
	initialVersion: 1,
	canReadDB: true,
	canSave: true,
	canDelete: true,
	canClear: true,
	canCreateStore: true,
	canDeleteDB: true
};

// timers are used to handle callbacks
var mockIndexedDB_openDBTimer;
var mockIndexedDB_createObjectStoreTimer;
var mockIndexedDB_cursorContinueTimer;
var mockIndexedDB_storeAddTimer;
var mockIndexedDB_storeDeleteTimer;
var mockIndexedDB_storeClearTimer;
var mockIndexedDB_storeOpenCursorTimer;
var mockIndexedDB_deleteDBTimer;

/**
 * call this in beforeEach() to reset the mock
 */
function resetIndexedDBMock () {
	mockIndexedDBItems.length = 0;

	mockIndexedDB_openDBSuccess = false;
	mockIndexedDB_openDBFail = false;
	mockIndexedDB_openDBAbort = false;
	mockIndexedDB_openDBBlocked = false;
	mockIndexedDB_openDBUpgradeNeeded = false;

	mockIndexedDB_openCursorSuccess = false;
	mockIndexedDB_openCursorFail = false;
	mockIndexedDB_cursorReadingDone = false;

	mockIndexedDB_saveSuccess = false;
	mockIndexedDB_saveFail = false;
	mockIndexedDB_deleteSuccess = false;
	mockIndexedDB_deleteFail = false;
	mockIndexedDB_clearSuccess = false;
	mockIndexedDB_clearFail = false;
	mockIndexedDB_createStoreSuccess = false;
	mockIndexedDB_createStoreFail = false;
	mockIndexedDB_deleteDBSuccess = false;
	mockIndexedDB_deleteDBFail = false;

	mockIndexedDB_cursorResultsIndex = 0;

	mockIndexedDBTestFlags.canOpenDB = true;
	mockIndexedDBTestFlags.openDBShouldBlock = false;
	mockIndexedDBTestFlags.openDBShouldAbort = false;
  mockIndexedDBTestFlags.upgradeNeeded = false;
	mockIndexedDBTestFlags.canReadDB = true;
	mockIndexedDBTestFlags.canSave = true;
	mockIndexedDBTestFlags.canDelete = true;
  mockIndexedDBTestFlags.canClear = true;
	mockIndexedDBTestFlags.canCreateStore = true;
	mockIndexedDBTestFlags.canDeleteDB = true;
	mockIndexedDBTestFlags.initialVersion = 1;

	clearTimeout(mockIndexedDB_openDBTimer);
	clearTimeout(mockIndexedDB_createObjectStoreTimer);
	clearTimeout(mockIndexedDB_cursorContinueTimer);
	clearTimeout(mockIndexedDB_storeAddTimer);
	clearTimeout(mockIndexedDB_storeDeleteTimer);
	clearTimeout(mockIndexedDB_storeClearTimer);
	clearTimeout(mockIndexedDB_storeOpenCursorTimer);
	clearTimeout(mockIndexedDB_deleteDBTimer);
}

/**
 * call this in beforeEach() to "save" data before a test
 */
function commitIndexedDBMockData (key, value) {
	var item = {
		'key': key,
		'value': value
	};

	mockIndexedDBItems.push(item);
}

/**
 * the cursor works like an indexeddb one, where calling continue() will provide
 * next item. items must be saved with the commitIndexedDBMockData() method in
 * order to be returned by the cursor.
 */
var mockIndexedDBCursor = {
	identity: 'mockIndexedDBCursor',

	continue: function () {
		mockIndexedDB_cursorResultsIndex++;
		mockIndexedDB_openCursorSuccess = false;

		mockIndexedDB_cursorContinueTimer = setTimeout(function () {
			mockIndexedDBCursorRequest.callSuccessHandler();
			mockIndexedDB_openCursorSuccess = true;
		}, 20);

		return mockIndexedDBCursorRequest;
	}
};

/**
 * with each call to continue() to get the cursor, the object will
 * have a key and value property. these are defined by the getters.
 */
mockIndexedDBCursor.__defineGetter__("key", function () {
	if (mockIndexedDB_cursorResultsIndex < mockIndexedDBItems.length) {
		var item = mockIndexedDBItems[mockIndexedDB_cursorResultsIndex];
		return item.key;
	}
	else {
		return null;
	}
});

mockIndexedDBCursor.__defineGetter__("value", function () {
	if (mockIndexedDB_cursorResultsIndex < mockIndexedDBItems.length) {
		var item = mockIndexedDBItems[mockIndexedDB_cursorResultsIndex];
		return item.value;
	}
	else {
		return null;
	}
});

mockIndexedDBCursor.__defineGetter__("resultCount", function () {
	return mockIndexedDBItems.length;
});

var mockIndexedDBCursorRequest = {
	callSuccessHandler: function () {
		if (this.onsuccess) {

			var cursorToReturn;

			if (mockIndexedDB_cursorResultsIndex < mockIndexedDBItems.length) {
				cursorToReturn = mockIndexedDBCursor;
				mockIndexedDB_cursorReadingDone = false;
			}
			else {
				cursorToReturn = null;
				mockIndexedDB_cursorReadingDone = true;
			}

			var event = {
				'type' : 'success',
				'bubbles' : false,
				'cancelable' : true,
				'target' : {
					'result' : cursorToReturn
				}
			};

			this.onsuccess(event);
		}
	},

	callErrorHandler: function () {
		if (this.onerror) {

			var event = {
				'type' : 'error',
				'bubbles' : true,
				'cancelable' : true,
				'target' : {
					'errorCode' : 1 // this is a made-up code
				}
			};

			this.onerror(event);
		}
	}
};

var mockIndexedDBStoreTransaction = {
	callSuccessHandler: function () {
		if (this.onsuccess) {
			var event = new CustomEvent("success", { bubbles: false, cancelable: true });
			this.onsuccess(event);
		}
	},

	callErrorHandler: function () {
		if (this.onerror) {
			var event = {
				'type' : 'error',
				'bubbles' : true,
				'cancelable' : true,
				'target' : {
					'errorCode' : 1 // this is a made-up code
				}
			};
			this.onerror(event);
		}
	}
};

var mockIndexedDBStore = {
	identity: 'mockedStore',
	_itemsPut: [],
	_itemsAdded: [],
	_itemsDeleted: [],
	_cleared: false,
	_indexesCreated: [],
	_cursorsOpened: [],
	
	// add returns a different txn than delete does. in indexedDB, the listeners are
	// attached to the txn that returned the store.
	add : function (data) { 
		
		this._itemsAdded.push(data);
		
		if (mockIndexedDBTestFlags.canSave === true) {
			mockIndexedDBItems.push(data);
			mockIndexedDB_storeAddTimer = setTimeout(function () {
				mockIndexedDBTransaction.callCompleteHandler();
				mockIndexedDB_saveSuccess = true;
			}, 20);
		}
		else {
			mockIndexedDB_storeAddTimer = setTimeout(function () {
				mockIndexedDBTransaction.callErrorHandler();
				mockIndexedDB_saveFail = true;
			}, 20);
		}

		return mockIndexedDBTransaction;
	},

	// for now, treating put just like an add.
	// TODO: do an update instead of adding
	put: function (data, key) {
		var tx = lodash.clone(mockIndexedDBTransaction, true);
		
		this._itemsPut.push({
			key: key, 
			item: data
		});
		
		if (mockIndexedDBTestFlags.canSave === true) {
			mockIndexedDBItems.push(data);
			mockIndexedDB_storeAddTimer = setTimeout(function () {
				tx.callCompleteHandler();
				mockIndexedDB_saveSuccess = true;
			}, 20);
		}
		else {
			mockIndexedDB_storeAddTimer = setTimeout(function () {
				tx.callErrorHandler();
				mockIndexedDB_saveFail = true;
			}, 20);
		}

		return tx;
	},

	// for delete, the listeners are attached to a request returned from the store.
	delete: function (data_id) {
		
		this._itemsDeleted.push(data_id);
		
		if (mockIndexedDBTestFlags.canDelete === true) {
			mockIndexedDB_storeDeleteTimer = setTimeout(function () {
				mockIndexedDBStoreTransaction.callSuccessHandler();
				mockIndexedDB_deleteSuccess = true;
			}, 20);
		}
		else {
			mockIndexedDB_storeDeleteTimer = setTimeout(function () {
				mockIndexedDBStoreTransaction.callErrorHandler();
				mockIndexedDB_deleteFail = true;
			}, 20);
		}

		return mockIndexedDBStoreTransaction;
	},

	// for clear, the listeners are attached to a request returned from the store.
	clear: function (data_id) {
		
		this._cleared = true;
		
		if (mockIndexedDBTestFlags.canClear === true) {
			mockIndexedDB_storeClearTimer = setTimeout(function () {
				mockIndexedDBStoreTransaction.callSuccessHandler();
				mockIndexedDB_clearSuccess = true;
			}, 20);
		}
		else {
			mockIndexedDB_storeClearTimer = setTimeout(function () {
				mockIndexedDBStoreTransaction.callErrorHandler();
				mockIndexedDB_clearFail = true;
			}, 20);
		}

		return mockIndexedDBStoreTransaction;
	},

	createIndex: function () {
		this._indexesCreated.push(arguments);
	},

	callSuccessHandler: function () {
		if (this.onsuccess) {
			var event = new CustomEvent("success", { bubbles: false, cancelable: true });
			this.onsuccess(event);
		}
	},

	callErrorHandler: function () {
		if (this.onerror) {
			var event = {
				'type' : 'error',
				'bubbles' : true,
				'cancelable' : true,
				'target' : {
					'errorCode' : 1 // this is a made-up code
				}
			};
			this.onerror(event);
		}
	},

	openCursor: function () {
		
		this._cursorsOpened.push(arguments);
		
		if (mockIndexedDBTestFlags.canReadDB === true) {
			mockIndexedDB_storeOpenCursorTimer = setTimeout(function () {
				mockIndexedDBCursorRequest.callSuccessHandler();
				mockIndexedDB_openCursorSuccess = true;
			}, 20);
		}
		else {
			mockIndexedDB_storeOpenCursorTimer = setTimeout(function () {
				mockIndexedDBCursorRequest.callErrorHandler();
				mockIndexedDB_openCursorFail = true;
			}, 20);
		}

		return mockIndexedDBCursorRequest;
	}
};

var mockIndexedDBTransaction = {
	_stores: {},
	
	objectStore: function (name) {
		if (this._stores[name])
			return this._stores[name];
		
		var store = lodash.clone(mockIndexedDBStore, true);
		return this._stores[name] = store;
	},

	callCompleteHandler: function () {
		if (this.oncomplete) {
			var event = {
				'type' : 'complete',
				'bubbles' : false,
				'cancelable' : true,
				'target' : { },
				'currentTarget' : { }
			};
			this.oncomplete(event);
		}
		
		// onsuccess is another event that IndexedDB provides here
		
		if (this.onsuccess) {
			var event = {
				'type' : 'success',
				'bubbles' : true,
				'cancelable' : true,
				'target' : { },
				'currentTarget' : { }
			};
			this.onsuccess(event);
		}
	},

	callErrorHandler: function () {
		if (this.onerror) {
			var event = {
				'type' : 'error',
				'bubbles' : true,
				'cancelable' : true,
				'target' : {
					'errorCode' : 1 // this is a made-up code
				}
			};
			this.onerror(event);
		}
	}
};

var mockIndexedDBDatabase = {
	transaction: function (stores, access) {
		var tx = lodash.clone(mockIndexedDBTransaction, true);
		tx._stores = stores;
		tx._mode = access;
		
		return tx;
	},

	close: function () {},

	'objectStoreNames' : {
		contains: function (name) {
			return false;
		}
	},

	createObjectStore: function (name, params) {
		if (mockIndexedDBTestFlags.canCreateStore === true) {
			mockIndexedDB_createObjectStoreTimer = setTimeout(function () {
				mockIndexedDBStore.callSuccessHandler();
				mockIndexedDB_createStoreSuccess = true;
			}, 20);
		}
		else {
			mockIndexedDB_createObjectStoreTimer = setTimeout(function () {
				mockIndexedDBStore.callErrorHandler();
				mockIndexedDB_createStoreFail = true;
			}, 20);
		}

		return mockIndexedDBStore;
	}
};

var mockIndexedDBOpenDBRequest = {
	callSuccessHandler: function (name, version) {
		if (!this.onsuccess)
			return;
		var db = lodash.clone(mockIndexedDBDatabase, true);
		db.name = name;
		db.version = version;
				
		var target = {
			'result' : db
		};
		
		var event = {
			'type' : 'success',
			'bubbles' : false,
			'cancelable' : true,
			'target' : target,
			'currentTarget' : target
		};

		this.onsuccess(event);
	},

	callErrorHandler: function () {
		if (!this.onerror)
			return;
		
		var event = {
			'type' : 'error',
			'bubbles' : true,
			'cancelable' : true,
			'target' : {
				'errorCode' : 1, // this is a made-up code
				'error' : {
					'message' : 'fail' // this is a made-up message
				}
			}
		};
		this.onerror(event);
	},

	callAbortHandler: function () {
		if (!this.onblocked)
			return;
		
		var event = {
			'type' : 'error',
			'bubbles' : true,
			'cancelable' : true,
			'target' : {
				'errorCode' : 1, // this is a made-up code
				'error' : {
					'message' : 'fail' // this is a made-up message
				}
			}
		};
		this.onblocked(event);
	},

	callBlockedHandler: function () {
		if (!this.onabort)
			return;
		
		var event = {
			'type' : 'error',
			'bubbles' : true,
			'cancelable' : true,
			'target' : {
				'errorCode' : 1, // this is a made-up code
				'error' : {
					'message' : 'fail' // this is a made-up message
				}
			}
		};
		this.onabort(event);
	},

	callUpgradeNeeded: function (name, version) {
		if (!this.onupgradeneeded)
			return;
		
		var db = lodash.clone(mockIndexedDBDatabase, true);
		db.name = name;
		db.version = version;
		
		var target = {
			'result' : db,
			'transaction' : {
				'abort': function () {
					mockIndexedDBTestFlags.openDBShouldAbort = true;
				}
			}
		};
		
		var event = {
			'type' : 'upgradeneeded',
			'bubbles' : false,
			'cancelable' : true,
			'oldVersion' : mockIndexedDBTestFlags.initialVersion,
			'newVersion' : version,
			'target' : target,
			'currentTarget' : target
		};
		this.onupgradeneeded(event);
		
		var target = {
			'result' : db
		};
		
		var event = {
			'type' : 'success',
			'bubbles' : false,
			'cancelable' : true,
			'target' : target,
			'currentTarget' : target
		};

		this.onsuccess(event);
	},

	result: mockIndexedDBDatabase
};

var mockIndexedDBDeleteDBRequest = {
	callSuccessHandler: function () {
		if (!this.onsuccess)
			return;
		var event = new CustomEvent("success", { bubbles: false, cancelable: true });
		this.onsuccess(event);
	},

	callErrorHandler: function () {
		if (!this.onerror)
			return;
		
		var event = {
			'type' : 'error',
			'bubbles' : true,
			'cancelable' : true,
			'target' : {
				'errorCode' : 1, // this is a made-up code
				'error' : {
					'message' : 'fail' // this is a made-up message
				}
			}
		};
		this.onerror(event);
	},

	callAbortHandler: function () {
		if (!this.onblocked)
			return;
		
		var event = {
			'type' : 'error',
			'bubbles' : true,
			'cancelable' : true,
			'target' : {
				'errorCode' : 1, // this is a made-up code
				'error' : {
					'message' : 'fail' // this is a made-up message
				}
			}
		};
		this.onblocked(event);
	},

	callBlockedHandler: function () {
		if (!this.onabort)
			return;
		
		var event = {
			'type' : 'error',
			'bubbles' : true,
			'cancelable' : true,
			'target' : {
				'errorCode' : 1, // this is a made-up code
				'error' : {
					'message' : 'fail' // this is a made-up message
				}
			}
		};
		this.onabort(event);
	},

	'result' : {}
};

/**
 * this mocks the window.indexedDB object. assuming a method that returns that object, this mock
 * object can be substituted like this:
 *
 * spyOn(service, 'getIndexedDBReference').andReturn(mockIndexedDB);
 */
var mockIndexedDB = {
	identity: 'mockedIndexDB',

	// note: the mock does not simulate separate stores, so dbname is ignored
	open: function (dbname, version) {
		var request = lodash.clone(mockIndexedDBOpenDBRequest, true);
		
		if (mockIndexedDBTestFlags.openDBShouldBlock === true) {
			mockIndexedDB_openDBTimer = setTimeout(function () {
				request.callBlockedHandler();
				mockIndexedDB_openDBBlocked = true;
			}, 20);
		}
		else if (mockIndexedDBTestFlags.openDBShouldAbort === true) {
			mockIndexedDB_openDBTimer = setTimeout(function () {
				request.callAbortHandler();
				mockIndexedDB_openDBAbort = true;
			}, 20);
		}
		else if (mockIndexedDBTestFlags.upgradeNeeded === true) {
			mockIndexedDB_openDBTimer = setTimeout(function () {
				request.callUpgradeNeeded(dbname, version);
				mockIndexedDB_openDBUpgradeNeeded = true;
			}, 20);
		}
		// these are order dependent, so we don't have to set so many
		// flags in the test. can leave 'canOpenDB' in its default
		// true state, so long as the other fail vars are checked first.
		else if (mockIndexedDBTestFlags.canOpenDB === true) {
			mockIndexedDB_openDBTimer = setTimeout(function () {
				request.callSuccessHandler(dbname, version);
				mockIndexedDB_openDBSuccess = true;
			}, 20);
		}
		else {
			mockIndexedDB_openDBTimer = setTimeout(function () {
				request.callErrorHandler();
				mockIndexedDB_openDBFail = true;
			}, 20);
		}

		return request;
	},

	deleteDatabase: function (dbname) {
		if (mockIndexedDBTestFlags.canDeleteDB === true) {
			mockIndexedDB_deleteDBTimer = setTimeout(function () {
				mockIndexedDBDeleteDBRequest.callSuccessHandler();
				mockIndexedDB_deleteDBSuccess = true;
			}, 20);
		}
		else {
			mockIndexedDB_deleteDBTimer = setTimeout(function () {
				mockIndexedDBDeleteDBRequest.callErrorHandler();
				mockIndexedDB_deleteDBFail = true;
			}, 20);
		}
 
		return mockIndexedDBDeleteDBRequest; 
	}

};

module.exports = {
	reset: resetIndexedDBMock,
	commit: commitIndexedDBMockData,
	mock: mockIndexedDB,
	flags: mockIndexedDBTestFlags,
	
	request: {
		error: function(items) {
			var request = {
				onsuccess: function() { },
				onerror: function() { }
			};

			setTimeout(function() {
				var shouldContinue = false;
				var cursor = {
					continue: function() {
						shouldContinue = true;
					}
				}

				var target = {
					result: cursor
				};

				var event = {
					target: target,
					currentTarget: target
				};

				for (var i = 0, max = items.length; i < max; ++i) {
					shouldContinue = false;
					cursor.value = items[i];
					request.onsuccess(event);

					if (!shouldContinue)
						break;
				}
				
				target.result = null;
				request.onerror({message:'error'});

			}, 5);

			return request;
		},
		
		success: function(items, single) {
			var request = {
				onsuccess: function() { },
				onerror: function() { }
			};

			if (single) {
				setTimeout(function() {
					var target = {
						result: items
					}
					var ev = {
						target: target,
						currentTarget: target
					};
					request.onsuccess(ev);
				}, 1);
				
				return request;
			}

			setTimeout(function() {
				var resolveContinue = null;

				var cursor = {
					continue: function() {
						if (!resolveContinue) {
							console.warn('IDB mock: called continue() before next result (or called continue() multiple times)');
							return;
						}

						resolveContinue();
						resolveContinue = null;
					},
					value: null
				}

				var target = {
					result: cursor
				};

				var event = {
					target: target,
					currentTarget: target
				} 
 
				var promise = Promise.resolve(0);
				
				for (var i = 0, max = items.length; i < max; ++i) {
					promise = promise.then(function(i) {
						return new Promise(function(resolve, reject) {
							cursor.value = items[i];

							resolveContinue = function() {
								resolve(i + 1);
							};

							request.onsuccess(event);
						});
					});
				}
				
				promise.then(function() {
					target.result = null;
					request.onsuccess(event);
				}).catch(function(e) { 
					console.error('IDB mock: caught exception:');
					console.error(e);
				});
				
			}, 1);

			return request;
		}
	}
};
