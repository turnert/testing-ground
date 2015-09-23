/* global describe, it, expect */
describe('basic map', function () {
	it('should be an object', function () {
		var basicMap = require('./basic-map.js');
		
		expect(typeof basicMap).toBe('object');
	});
	it('should have no exports', function () {
		var basicMap = require('./basic-map.js');
		
		expect(Object.keys(basicMap).length).toBe(0)
	});
	it('should write the data written to stdin back to stdout', function (done) {
		var spawn = require('child_process').spawn,
			basicMap = spawn('node', ['./basic-map.js']),
			dataToWrite = 'Hello\n';
			
			basicMap.stdout.setEncoding('utf8');
			
			basicMap.stdout.on('data', function (data) {
				expect(data).toBe(dataToWrite);
				done();
			});
			
			basicMap.stdin.write(dataToWrite);
	});
	it('should exit when stdin is ended', function (done) {
			var spawn = require('child_process').spawn,
			basicMap = spawn('node', ['./basic-map.js']);
			
			basicMap.on('exit', function () {
				expect(true).not.toBeTruthy();
				done();	
			});
			
			basicMap.stdin.end();
	});
});