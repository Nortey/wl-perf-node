var device = require("./device"),
	Deferred = require("JQDeferred");

/******************************************************************************************************
Multi Device Init Test
curl -i -X GET http://localhost:3000
Description:
*******************************************************************************************************/
var _multiDeviceInitTest = function(numDevices, simulationTime){
	console.log("Beginning simulation using " + numDevices + " devices running for " + simulationTime + " milliseconds.");
	
	var devices = [];
	var deferreds = [];

	for(var i=0; i<numDevices; i++){
		var beginTime = Math.floor(Math.random()* (simulationTime-1000));
		var d = device.createDevice();	
		devices.push(d);
		deferreds.push(d.init(null, beginTime));
	} 

	Deferred.when.apply(Deferred, deferreds).done(function(){
		_multiDeviceInitTestLogResults(devices);
	});
};

var _multiDeviceInitTestLogResults = function(devices){
	var averageInitTime = 0;
	var maxInitTime = devices[0].initTime;
	var minInitTime = devices[0].initTime;

	for(var i=0; i<devices.length; i++){
		averageInitTime += devices[i].initTime;
		maxInitTime = Math.max(devices[i].initTime, maxInitTime);
		minInitTime = Math.min(devices[i].initTime, minInitTime);
	}

	averageInitTime = Math.floor( averageInitTime / devices.length );

	console.log("-----------------Results--------------------");
	console.log("Average init Time: " + averageInitTime);
	console.log("Max init Time: " + maxInitTime);
	console.log("Min init Time: " + minInitTime);
	console.log("--------------------------------------------");
}

/*var multiDeviceInitTestLogResults = function(){
	var averageInitTime = 0;
	var maxInitTime = devices[0].initTime;
	var minInitTime = devices[0].initTime;

	var numAdapterCalls = 0;
	var averageAdapterCallTime = 0;
	var minAdapterCallTime = devices[0].adapterCallTimes[0];
	var maxAdapterCallTime = devices[0].adapterCallTimes[0];

	for(var i=0; i<devices.length; i++){
		clearInterval(devices[i].adapterInterval);

		averageInitTime += devices[i].initTime;
		maxInitTime = Math.max(devices[i].initTime, maxInitTime);
		minInitTime = Math.min(devices[i].initTime, minInitTime);

		for(var j=0; j<devices[i].adapterCallTimes.length; j++){
			numAdapterCalls++;
			averageAdapterCallTime += devices[i].adapterCallTimes[j];
			maxAdapterCallTime = Math.max(devices[i].adapterCallTimes[j], maxAdapterCallTime);
			minAdapterCallTime = Math.min(devices[i].adapterCallTimes[j], minAdapterCallTime);
		}
	}
	averageInitTime = Math.floor( averageInitTime / devices.length );
	averageAdapterCallTime = Math.floor(averageAdapterCallTime / numAdapterCalls);

	console.log("-----------------Results--------------------");
	console.log("Average init Time: " + averageInitTime);
	console.log("Max init Time: " + maxInitTime);
	console.log("Min init Time: " + minInitTime);
	console.log(" ");
	console.log("Num adapter calls: " + numAdapterCalls);
	console.log("Average Adapter Call Time: " + averageAdapterCallTime);
	console.log("Max Adapter Call Time: " + maxAdapterCallTime);
	console.log("Min Adapter Call Time: " + minAdapterCallTime);
	console.log("--------------------------------------------");
}*/

module.exports = {
	multiDeviceInitTest: _multiDeviceInitTest
};