/* global process */

function performReduce (data) {
	return [data];
}

function writeNext(datum, remainingData) {
	process.stdout.write(datum, 'utf8', function () {
		var nextDatum;
		
		if (remainingData.length > 0) {
			nextDatum = remainingData.shift();
			writeNext(nextDatum, remainingData);								
		}
	});
}

process.stdin.setEncoding('utf8');

process.stdin.on('data', function (data) {
	var reducedData = performReduce(data),
		nextDatum = reducedData.shift();
	
	writeNext(nextDatum, reducedData);
});

process.stdin.on('finish', function() {

		process.stdout.destroy();
		process.stdout.on('finish', function () {
			process.exit();				
		});
});