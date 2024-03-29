var device = require('./device');
var http = require('http');
var config = require('./config.json');
var devices = [];
var tests = require("./tests")

http.globalAgent.maxSockets = config.numDevices + 1; 

http.createServer(function (req, res) {
	if(req.url == "/"){
		
	}

	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('Hello World\n');
}).listen(3000, "127.0.0.1");

//tests.multiDeviceInitTest(config.numDevices, config.simulationTime);
tests.multiDeviceAdapterCallTest(config.numDevices, config.simulationTime);


console.log('Server running at http://127.0.0.1:3000/');