
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
	
	it('should upgrade from the specified version to the specified version', function(done) {
		
		idbMock.reset();
		idbMock.flags.upgradeNeeded = true;
		idbMock.flags.initialVersion = 3;
		
		var request = idbMock.mock.open('somedb', 5);
		
		request.onupgradeneeded = function(ev) {
			expect(ev.oldVersion).toBe(3);
			expect(ev.newVersion).toBe(5);
			
			done();
		};
		
		request.onsuccess = function(ev) {
			expect(true).toBe(false);
		};
		
		request.onerror = function(ev) {
			expect(true).toBe(false);
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

