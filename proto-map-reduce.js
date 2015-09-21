/* global process */
var mapReduce = {},
	fs = require('fs'),
	Q = require('q'),
	defer = Q.defer(),
	spawn = require('child_process').spawn,
	totalMappers = 0,
	totalReducers = 0,
	allData = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', function (data) {
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

function createReduceWorkers () {
	var reduceWorkers = [],
		i;
	for (i = 0; i < 1; i++) {
		reduceWorkers.push(spawn('node', ['./basic-reduce.js']));
		totalReducers += 1;
		
		reduceWorkers[i].stdout.setEncoding('utf8');
		
		reduceWorkers[i].stdout.on('data', function (data) {
			aggregate(data);
		});
		
		reduceWorkers[i].on('exit', function () {
			totalReducers -= 1;
			if (totalReducers == 0) {
				defer.resolve(allData);
			}
		});
	}
	
	return reduceWorkers;
}

function pipeNextFileToMap (fileName, mapWorker, remainingFiles) {
	var readable = fs.createReadStream(fileName, {encoding: 'utf8', end: false});
	
	readable.pipe(mapWorker.stdin);
	
	readable.on('end', function () {
		var nextFileName = remainingFiles.shift();
		if (remainingFiles.length > 0) {
			pipeNextFileToMap (nextFileName, mapWorker, remainingFiles);
		} else {
			readable.unpipe();
			mapWorker.stdin.destroy();
		}
	});
}

function createMapWorkers (dataSets, reduceWorkers) {
	dataSets.forEach(function (allFiles) {
		var mapWorker = spawn('node', ['./basic-map.js']),
		fileName = allFiles.shift();
		
		totalMappers += 1;
		
		mapWorker.stdin.setEncoding('utf8');
		// dataSet.forEach(function (fileName) {
		// 	var readable = fs.createReadStream(fileName, {encoding: 'utf8', end: false});
			
		// 	readable.pipe(mapWorker.stdin);
			
		// 	readable.on('end', function () {
		// 		dataSet.pop()
		// 	});
			
		mapWorker.stdout.on('data', function (data) {
			var reduceIndex = reducePartition(data);
			
			// reduceWorkers[reduceIndex].stdin.write(data);
			mapWorker.stdout.pipe(reduceWorkers[reduceIndex].stdin, {end: false});
			mapWorker.stdout.on('end', function () {
				mapWorker.stdout.unpipe(reduceWorkers[reduceIndex]);
			});
		});
		// });
		pipeNextFileToMap(fileName, mapWorker, allFiles);
		
		mapWorker.on('exit', function () {
			totalMappers -= 1;
			if (totalMappers == 0) {
				reduceWorkers.forEach(function (worker) {
					worker.stdin.destroy();
				});
			}
		});
	})
}

function execute (data) {
	var partitionedData = mapPartition(data),
		reduceWorkers = createReduceWorkers();
		
	createMapWorkers(partitionedData, reduceWorkers);
	
	return defer.promise;
}

mapReduce.execute = execute;

module.exports = mapReduce;