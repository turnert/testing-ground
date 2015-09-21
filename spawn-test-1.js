var fs = require('fs'),
	spawn = require('child_process').spawn,
	readFromStdin = spawn('node', ['./read-from-stdin.js']),
	readable = fs.createReadStream('./test', {encoding: 'utf8'});
	
	readable.pipe(readFromStdin.stdin);