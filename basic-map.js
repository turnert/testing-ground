/* global process */
function performMap (data) {
	return [data];
}

process.stdin.setEncoding('utf8');

process.stdin.on('data', function (data) {
	var mappedData = performMap(data);
	
	mappedData.forEach(function (datum) {
		process.stdout.write(datum);
	});
});

process.stdin.on('end', function () {
	process.exit();
});