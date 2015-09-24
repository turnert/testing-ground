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
		NUM_MAP_WORKERS = 2,
		totalMapWorkers = NUM_MAP_WORKERS,
		NUM_REDUCE_WORKERS = 1,
		ALPHABET_LENGTH = 26,
		ASCII_LOWER_CASE_A = 97,
		allMapWorkers = [],
		allReduceWorkers = [],
		reduceWorkersKilled = 0,
		allData = '';
	
	that.execute = execute;
	
	function alphabeticallyGivenGroup(group) {
		return function alphabetically(val) {
			var onlyAlphaNumeric = val.replace(/\W/g, ''),
				firstLetter = onlyAlphaNumeric.charAt(0).toLowerCase(),
				INCREMENT = Math.ceil(ALPHABET_LENGTH / NUM_MAP_WORKERS);
				
			return firstLetter.charCodeAt(0) >= (ASCII_LOWER_CASE_A + group * INCREMENT) && 
				firstLetter.charCodeAt(0) < (ASCII_LOWER_CASE_A + (group + 1) * INCREMENT); 	
		}
	}
	
	function mapPartition (data) {
		var partitionedData = [],
			i;
		
		for (i = 0; i < NUM_MAP_WORKERS; i++) {
			partitionedData.push(data.filter(alphabeticallyGivenGroup(i)));
		}
		
		return partitionedData;
	}
	
	function reducePartition (data) {
		return 0;
	}
	
	function aggregate (data) {
		allData = allData + data;
		return allData;
	}
	
	function handleStdoutData(reducer) {
		reducer.stdout.setEncoding('utf8');
		reducer.stdout.on('data', function (data) {
			aggregate(data);
		});
	}
	
	function handleExit(reducer) {
		var totalReducers = allReduceWorkers.length;
		reducer.on('exit', function () {
				reduceWorkersKilled += 1;
				if (totalReducers == reduceWorkersKilled) {
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
		worker.stdout.on('finish', function () {
			totalMapWorkers -= 1;	
			if (totalMapWorkers == 0) {
				allMapWorkers.forEach(function (workerToEnd) {
					workerToEnd.kill();
				});
				allReduceWorkers.forEach(endWorker);
			}
		});
	}
	
	function endWorker(worker) {
		worker.stdin.end();		
	}
	
	function pipeNextFileToMap (fileName, mapWorker, remainingFiles) {
		var readable;
		
		if (typeof fileName !== 'string' && remainingFiles.length == 0) {
			endWorker(mapWorker);
			return;
		}
		else if (typeof fileName !== 'string' && remainingFiles.length > 0) {
			pipeNextFileToMap (remainingFiles.shift(), mapWorker, remainingFiles);
		}
		readable = fs.createReadStream(fileName, {encoding: 'utf8'});
		readable.pipe(mapWorker.stdin, {end: false});
		
		
		readable.on('end', function () {
			var nextFileName;
			readable.unpipe(mapWorker.stdin);
			if (remainingFiles.length > 0) {
				nextFileName = remainingFiles.shift()
				pipeNextFileToMap (nextFileName, mapWorker, remainingFiles);
			} else {
				endWorker(mapWorker);
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
				
			// while (typeof fileName !== 'string' && allFiles.length > 0) {
			// 	fileName = allFiles.shift();
			// }
			
			handleMapWorkerStdout(mapWorker);
			handleMapWorkerExit(mapWorker);
			// if (typeof fileName == 'string') {
				pipeNextFileToMap(fileName, mapWorker, allFiles);			
			// }
			// else {
			// 	mapWorker.stdin.end();
			// }
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
		
		allData = '';
		createReduceWorkers();
		createMapWorkers(partitionedData);
		
		return defer.promise;
	}
}

module.exports = MapReduce;