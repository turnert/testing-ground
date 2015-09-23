/* global process */
function MapReduce () {
	// Constructor guard
	if (!(this instanceof MapReduce)) {
		return new MapReduce();
	}
	var that = this,
		fs = require('fs'),
		Q = require('q'),
		defer = Q.defer(),
		spawn = require('child_process').spawn,
		totalMapWorkers = 0,
		NUM_MAP_WORKERS = 1,
		NUM_REDUCE_WORKERS = 1,
		allMapWorkers = [],
		allReduceWorkers = [],
		reduceWorkersKilled = 0,
		allData = '';
	
	that.execute = execute;
	// that.data = '';
	
	// process.stdin.setEncoding('utf8');
	// process.stdin.on('data', function (data) {
	// 	aggregate(data);
	// });
	
	function mapPartition (data) {
		return [data];
	}
	
	function reducePartition (data) {
		return 0;
	}
	
	function aggregate (data) {
		// that.allData = that.allData + data;
		// return that.allData;
		allData = allData + data;
		return allData;
	}
	
	function handleStdoutData(reducer) {
		reducer.stdout.setEncoding('utf8');
		reducer.stdout.on('data', function (data) {
			console.log('got reducer data: "' + data + '"');
			aggregate(data);
		});
	}
	
	function handleExit(reducer) {
		var totalReducers = allReduceWorkers.length;
		reducer.on('exit', function () {
			console.log('reducer is done processing input.  total reducers left:', totalReducers - reduceWorkersKilled);
				reduceWorkersKilled += 1;
				if (totalReducers == reduceWorkersKilled) {
					console.log('no reducers left, time to resolve');
					defer.resolve(allData);
				}
		});
	}
	
	function initializeReduceWorker(reduceWorker) {
		handleStdoutData(reduceWorker);
		handleExit(reduceWorker);
	}
	
	function createReduceWorkers () {
		var i;
		for (i = 0; i < NUM_REDUCE_WORKERS; i++) {
			allReduceWorkers.push(spawn('node', ['./basic-reduce.js']));
		}
		
		allReduceWorkers.forEach(initializeReduceWorker);
	}
	
	function handleMapWorkerExit(worker) {
		worker.on('exit', function () {
			totalMapWorkers -= 1;	
			if (totalMapWorkers == 0) {
				allReduceWorkers.forEach(function (workerToEnd) {
					workerToEnd.stdin.end();						
				});
			}
		});
	}
	
	function pipeNextFileToMap (fileName, mapWorker, remainingFiles) {
		var readable = fs.createReadStream(fileName, {encoding: 'utf8'});
		
		readable.pipe(mapWorker.stdin, {end: false});
		
		
		readable.on('end', function () {
			var nextFileName;
			readable.unpipe(mapWorker.stdin);
			if (remainingFiles.length > 0) {
				nextFileName = remainingFiles.shift()
				pipeNextFileToMap (nextFileName, mapWorker, remainingFiles);
			} else {
				mapWorker.stdin.end();
			}
		});
	}
	
	function handleMapWorkerStdout(worker) {
		worker.stdout.setEncoding('utf8');
		worker.stdout.on('data', function (data) {
			var reduceIndex = reducePartition(data);	
			allReduceWorkers[reduceIndex].stdin.write(data, 'utf8');
		});
	}
	
	function initializeMapWorkerGivenData(data) {
		return function initializeMapWorker(mapWorker, index) {
			var allFiles = data[index],
				fileName = allFiles.shift();
			
			totalMapWorkers += 1;
			handleMapWorkerStdout(mapWorker);
			pipeNextFileToMap(fileName, mapWorker, allFiles);
			handleMapWorkerExit(mapWorker);		
		}
	}
	
	function createMapWorkers (dataSets) {
		var i;
		for (i = 0; i < NUM_MAP_WORKERS; i++) {
			allMapWorkers.push(spawn('node', ['./basic-map.js']));
		}
		
		allMapWorkers.forEach(initializeMapWorkerGivenData(dataSets));
	}
	
	function execute (data) {
		var partitionedData = mapPartition(data);
		// that.allData = '';
		allData = '';
		createReduceWorkers();
		createMapWorkers(partitionedData);
		
		return defer.promise;
	}
}

module.exports = MapReduce;