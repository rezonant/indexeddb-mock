
var idbMock = require('../indexeddb.js');

describe('mock.open', function() { 
	it('should produce some kind of IDBDatabase mock', function(done) {
		idbMock.reset();
		idbMock.mock.open('somedb', 1).onsuccess = function(ev) {
			expect(ev.target).not.toBe(null);
			
			if (ev.target)
				expect(ev.target.result).not.toBe(null);
			done();
		};
	});
	
	it('should provide target/currentTarget on upgrade', function(done) {
		idbMock.reset();
		idbMock.flags.upgradeNeeded = true;
		idbMock.flags.initialVersion = 3; 
		
		var request = idbMock.mock.open('somedb', 5);
		var readyForSuccess = false;
		request.onupgradeneeded = function(ev) {
			readyForSuccess = true;
			expect(ev.target).toBeDefined();
			expect(ev.currentTarget).toBeDefined();
			done();
		};
		
		request.onsuccess = function(ev) {
			if (!readyForSuccess) {
				expect(true).toBe(false);
				done();
			}
		};
		
		request.onerror = function(ev) {
			expect(true).toBe(false);
			done();
		};
	});
	
	it('should provide target/currentTarget on success', function(done) {
		idbMock.reset();
		
		var request = idbMock.mock.open('somedb', 5);
		
		request.onupgradeneeded = function(ev) {
			expect(true).toBe(false);
			done();
		};
		
		request.onsuccess = function(ev) {
			expect(ev.target).toBeDefined();
			expect(ev.currentTarget).toBeDefined();
			done();
		};
		
		request.onerror = function(ev) {
			expect(true).toBe(false);
			done();
		};
	});
	
	it('should provide call onsuccess after onupgradeneeded', function(done) {
		idbMock.reset();
		idbMock.flags.upgradeNeeded = true;
		idbMock.flags.initialVersion = 3;
		
		var request = idbMock.mock.open('somedb', 5);
		var readyForSuccess = false;
		
		request.onupgradeneeded = function(ev) {
			readyForSuccess = true;
		};
		
		request.onsuccess = function(ev) {
			if (!readyForSuccess) {
				expect(true).toBe(false);
			}
			
			done();
		};
		
	});
	it('should store the authorized stores and mode of a new transaction', function(done) {
		idbMock.reset();
		
		var request = idbMock.mock.open('somedb', 5);
		var readyForSuccess = false;
		
		request.onsuccess = function(ev) {
			
			var db = ev.target.result;
			var tx = db.transaction(['store1', 'store2'], 'readonlyX');
			
			expect(tx).not.toBe(null);
			expect(tx._stores.length).toBe(2);
			expect(tx._stores[0]).toBe('store1');
			expect(tx._stores[1]).toBe('store2');
			expect(tx._mode).toBe('readonlyX');
			
			done();
		};
		
	});
		
	it('never reuses the open request (because that would be broken)', function() {
		
		idbMock.reset();
		
		var request1 = idbMock.mock.open('somedb', 5);
		var request2 = idbMock.mock.open('somedb', 5);
		
		expect(typeof request1.callSuccessHandler == 'function').toBe(true);
		expect(request1).not.toBe(request2);
	});
		
	it('should upgrade from the specified version to the specified version', function(done) {
		
		idbMock.reset();
		idbMock.flags.upgradeNeeded = true;
		idbMock.flags.initialVersion = 3;
		
		var request = idbMock.mock.open('somedb', 5);
		var readyForSuccess = false;
		
		request.onupgradeneeded = function(ev) {
			readyForSuccess = true;
			expect(ev.oldVersion).toBe(3);
			expect(ev.newVersion).toBe(5);
			
			done();
		};
		
		request.onsuccess = function(ev) {
			if (!readyForSuccess) {
				expect(true).toBe(false);
				done();
			}
		};
		
		request.onerror = function(ev) {
			expect(true).toBe(false);
			done();
		}
	});
	
	it('should produce an IDBDatabase mock which has a name and version', function(done) {
		idbMock.reset();
		var request = idbMock.mock.open('somedb', 32);
				
		request.onsuccess = function(ev) {
			expect(ev.target).not.toBe(null);
			if (!ev.target)
				return;
			expect(ev.target.result).not.toBe(null);
			
			var db = ev.target.result;
			expect(db.name).toBe('somedb');
			expect(db.version).toBe(32);
			done();
		};
		
		request.onerror = function(ev) {
			expect(false).toBe(true);
			done();
		}
	});
});

