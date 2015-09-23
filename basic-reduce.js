/* global process */
function performReduce (data) {
	return [data];
}

function writeNext(datum, remainingData) {
	process.stdout.write(datum + '\n', 'utf8', function () {
		var nextDatum;
		if (remainingData.length > 0) {
			nextDatum = remainingData.shift();
			writeNext(nextDatum, remainingData);								
		}
	});
}

process.stdin.setEncoding('utf8');
process.stdin.setMaxListeners(20000);
process.stdout.setMaxListeners(20000);

process.stdin.on('data', function (data) {
	var reducedData = performReduce(data),
		nextDatum = reducedData.shift();
	
	writeNext(nextDatum, reducedData);
});

process.stdin.on('end', function() {
	// process.exit();
});