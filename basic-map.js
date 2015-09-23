/* global process */
function performMap (data) {
	return [data];
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', function (data) {
	var mappedData = performMap(data);
	
	mappedData.forEach(function (datum) {
		process.stdout.write(datum, 'utf8');
	});
});

process.stdin.on('finish', function () {
	process.stdout.destroy();
	process.stdout.on('finish', function () {
		process.exit();
	});
});