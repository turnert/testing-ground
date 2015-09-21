/* global describe, it, expect */

describe('basic reduce', function () {
	it('should be an object', function () {
		var basicReduce = require('./basic-reduce.js');
		expect(typeof basicReduce).toBe('object');
	});
	it('should have no exports', function () {
		var basicReduce = require('./basic-reduce.js');
		expect(Object.keys(basicReduce).length).toBe(0);
	});
		it('should write the data written to stdin back to stdout', function (done) {
		var spawn = require('child_process').spawn,
			basicMap = spawn('node', ['./basic-reduce.js']),
			dataToWrite = 'Hello\n';
			
			basicMap.stdout.setEncoding('utf8');
			
			basicMap.stdout.on('data', function (data) {
				expect(data).toBe(dataToWrite);
				done();
			});
			
			basicMap.stdin.write(dataToWrite);
	});
});