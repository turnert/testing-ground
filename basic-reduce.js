/* global process */
function performReduce (data) {
	return [data];
}

process.stdin.setEncoding('utf8');

process.stdin.on('data', function (data) {
	var reducedData = performReduce(data);
	
	process.stdout.setEncoding('utf8');
	reducedData.forEach(function (datum) {
		process.stdout.write(datum);
	});
});

process.stdin.on('end', function() {
	process.exit();
});