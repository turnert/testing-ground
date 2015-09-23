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
		totalMappers = 0,
		NUM_REDUCERS = 1,
		reducersKilled = 0,
		allData = '';
	
	that.execute = execute;
	totalMappers = 0;
	
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', function (data) {
		console.log('Got data back, aggregating the data');
		aggregate(data);
	});
	
	function mapPartition (data) {
		return [data];
	}
	
	function reducePartition (data) {
		return 0;
	}
	
	function aggregate (data) {
		allData += data;
		return allData;
	}
	
	function handleStdoutData(reducer) {
		reducer.stdout.setEncoding('utf8');
		reducer.stdout.on('data', function (data) {
			console.log('reducer wrote data to stdout:', data);
			process.stdin.write(data, 'utf8', function () {
				console.log('Wrote to stdin successfully');
			});
		});
	}
	
	function handleExit(reducer, totalReducers) {
		reducer.on('exit', function () {
			console.log('reducer is done processing input.  total reducers left:', totalReducers - reducersKilled);
				reducersKilled += 1;
				if (totalReducers === reducersKilled) {
					console.log('no reducers left, time to resolve');
					defer.resolve(allData);
				}
		});
	}
	
	function createReduceWorkers () {
		var workers = [],
			i;
		for (i = 0; i < NUM_REDUCERS; i++) {
			workers.push(spawn('node', ['./basic-reduce.js']));
			
			handleStdoutData(workers[i]);
			handleExit(workers[i], 1);
		}
		
		return workers;
	}
	
	function pipeNextFileToMap (fileName, mapWorker, remainingFiles) {
		var readable = fs.createReadStream(fileName, {encoding: 'utf8', end: false});
		
		readable.pipe(mapWorker.stdin);
		
		readable.on('end', function () {
			var nextFileName = remainingFiles.shift();
			readable.unpipe(mapWorker.stdin);
			if (remainingFiles.length > 0) {
				pipeNextFileToMap (nextFileName, mapWorker, remainingFiles);
			} else {
				// mapWorker.stdin.end();
			}
		});
	}
	
	function createMapWorkers (dataSets, reduceWorkers) {
		dataSets.forEach(function (allFiles) {
			var mapWorker = spawn('node', ['./basic-map.js']),
			fileName = allFiles.shift();
			totalMappers += 1;
			
			// reduceWorkers.forEach(function (worker) {
			// 	console.log('setting up end condition');
			// 	worker.stdin.on('data', function () {
			// 		console.log('reducer received some data');
			// 		console.log('totalMappers:', totalMappers);
			// 		if (totalMappers == 0) {
			// 			console.log('detected that all mappers have finished.  Ending the reducers');
			// 			reduceWorkers.forEach(function (workerToEnd) {
			// 				workerToEnd.stdin.end();						
			// 			});
			// 		}
			// 	});
			// });
			
			mapWorker.stdin.setEncoding('utf8');
			mapWorker.stdout.setEncoding('utf8');
			mapWorker.stdout.on('data', function (data) {
				console.log('mapWorker wrote some data to stdout');
				var reduceIndex = reducePartition(data),	
				// reduceWorkers[reduceIndex].stdin.write(data);
				outcome = reduceWorkers[reduceIndex].stdin.write(data + '\n', 'utf8', function () {
					console.log('finished writting:', data);
					console.log('outcome:', outcome);
				});
			});
			// });
			pipeNextFileToMap(fileName, mapWorker, allFiles);
			
			mapWorker.on('exit', function () {
				totalMappers -= 1;	
				reduceWorkers.forEach(function (workerToEnd) {
					// workerToEnd.stdin.end();						
				});		
				console.log('Mapper is done processing input.  Mappers left:', totalMappers);
			});
		})
	}
	
	function execute (data) {
		var partitionedData = mapPartition(data),
			reduceWorkers = createReduceWorkers();
			
		createMapWorkers(partitionedData, reduceWorkers);
		
		return defer.promise;
	}
}

module.exports = MapReduce;