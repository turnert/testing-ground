/* global process */
var Q = require('q'),
	allWriteVows = [],
	allWritePromises = [];

function performReduce (data) {
	return [data];
}

function writeNext(datum, remainingData, vow) {
	process.stdout.write(datum, 'utf8', function () {
		var nextDatum,
			newVow = Q.defer();
		vow.resolve(true);
		if (remainingData.length > 0) {
			nextDatum = remainingData.shift();
			allWriteVows.push(newVow);
			allWritePromises.push(newVow.promise);
			writeNext(nextDatum, remainingData, newVow);								
		}
	});
}

process.stdin.setEncoding('utf8');

process.stdin.on('data', function (data) {
	var reducedData = performReduce(data),
		nextDatum = reducedData.shift(),
		vow = Q.defer();
	allWriteVows.push(vow);
	allWritePromises.push(vow.promise);
	writeNext(nextDatum, reducedData, vow);
});

process.stdin.on('finish', function() {
	Q.allSettled(allWritePromises).then(function (results) {
		process.stdout.destroy();
		process.stdout.on('finish', function () {
			process.exit();				
		});
	});
});