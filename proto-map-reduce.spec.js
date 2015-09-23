/* global describe, expect, it, beforeEach, xit */

describe('proto map reduce', function () {
	var ProtoMapReduce = require('./proto-map-reduce.js'),
		protoMapReduce,
		fs = require('fs'),
		methods = ['execute'],
		inputFileName = './test',
		testData,
		doubleTestData;
	
	
	beforeEach(function () {
		protoMapReduce = new ProtoMapReduce();
		testData = [inputFileName];
		doubleTestData = [inputFileName, inputFileName];
	});
	describe('constructor', function () {
		it('should be a constructor', function () {
			expect(protoMapReduce instanceof ProtoMapReduce).toBeTruthy();
		});
		it('should be a constructor even if invoked', function () {
			var invokedProtoMapReduce = ProtoMapReduce();
			expect(invokedProtoMapReduce instanceof ProtoMapReduce).toBeTruthy();
		});
	});
	it('should be an object', function () {
		expect(typeof protoMapReduce).toBe('object');
	});
	methods.forEach(function (method) {
		it('should have a ' + method + ' method', function () {
			expect(typeof protoMapReduce[method]).toBe('function');
		});
	});
	describe('API', function () {
		describe('execute', function () {
			
			it('should return an object with a `then` property', function () {
				expect(protoMapReduce.execute(testData).then).toBeDefined();
			});
			it('should return an object which has a then function', function () {
				expect(typeof protoMapReduce.execute(testData).then).toBe('function');
			});
			it('should return a promise that resolves to the data read from the input file', function (done) {
				fs.readFile(inputFileName, {encoding: 'utf8'}, function (err, data) {
					if (err) throw err;
					protoMapReduce.execute(testData).then(function (result) {
						expect(result).toBe(data);
						done();
					}, function (reason) {
						expect(reason).toBeUndefined();
					});
				})
			});
			it('should work with multiple input files', function (done) {
				fs.readFile(inputFileName, {encoding: 'utf8'}, function (err, data) {
					if (err) throw err;
					protoMapReduce.execute(doubleTestData).then(function (result) {
						expect(result).toBe(data + data);
					done();
				});
				});
			});
		});
	});
});