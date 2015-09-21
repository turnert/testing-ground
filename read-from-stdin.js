function readFromStdin() {
	var Q = require('q'),
		previousLineWritten = [],
		linesWrittenPromises = [],
		fs = require('fs'),
		output = fs.open('./output', 'a', function (err) {
			if (err) throw err;
			
			console.log('starting readFromStdin');
			process.stdin.setEncoding('utf8');
			process.stdin.on('data', function(data) {
				console.log('data was read');
				console.log('data:\n', data);
				previousLineWritten.push(Q.defer());
				previousLineWritten[0].resolve(true);
				var lines = data.split('\n');
				console.log('lines:', lines);
				lines.forEach(function(line, index) {
					console.log('line:', line);
					previousLineWritten.push(Q.defer());
					linesWrittenPromises.push(previousLineWritten[index + 1].promise);
					console.log('prepared the q library stuff');
					previousLineWritten[index].promise.then(function () {
						console.log('previous promise was resolved');
						output.write('./output', 'line: ' + line, function (err) {
							console.log('finished writing that line');
							previousLineWritten[index + 1].resolve(true);
							if (err) {
								console.log('An error was encountered:', err);
								previousLineWritten[index + 1].reject(err);
								throw err;
							}
						});
					});
				});
			});
	});
	
	process.stdin.on('end', function() {
		console.log('attempting to settle all promises');
		console.log(Q.allSettled);
		Q.allSettled(linesWrittenPromises).then(function () {
			console.log('Cor!  All promises were settled!');
			output.close();
			process.exit();		
		}, function (reason) {
			console.log('Attempt failed:', reason);
		});
	});
}

readFromStdin();