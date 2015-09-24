/* global describe, expect, it, beforeEach, xit, xdescribe */

describe('proto map reduce', function () {
	var ProtoMapReduce = require('./proto-map-reduce.js'),
		protoMapReduce,
		fs = require('fs'),
		methods = ['execute'],
		inputFileName = './test',
		inputFileNames = ['./test', './anotherTest'],
		testData,
		doubleTestData;
	
	
	beforeEach(function () {
		protoMapReduce = new ProtoMapReduce();
		testData = [inputFileNames[0]];
		doubleTestData = [inputFileNames[0], inputFileNames[0]];
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
			it('should return the expected string with multiple input files', function (done) {
				fs.readFile(inputFileName, {encoding: 'utf8'}, function (err, data) {
					if (err) throw err;
					protoMapReduce.execute(doubleTestData).then(function (result) {
						expect(result).toBe(data + data);
						done();
					});
				});
			});
			describe('multiple map workers', function () {
				it('should return a string with non-trivial input and multiple map workers', function (done) {
					protoMapReduce.execute(inputFileNames).then(function (result) {
						expect(typeof result).toBe('string');
						done();
					});
				});
				it('should return a string that contains data from all input files', function (done) {
					fs.readFile(inputFileNames[0], {encoding: 'utf8'}, function(err, data) {
						if (err) throw err;
						
						fs.readFile(inputFileNames[1], {encoding: 'utf8'}, function (err, moreData) {
							if (err) throw err;
							protoMapReduce.execute(inputFileNames).then(function (result) {
								expect(result.indexOf(data) >= 0).toBeTruthy();
								expect(result.indexOf(moreData) >= 0).toBeTruthy();
								done();
							});
						});
					});
				});
			});
		});
	});
});