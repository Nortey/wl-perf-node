var config = require('./config.json')
var http = require('http');
var uuids = require('./uuids.json')
var querystring = require('querystring');
var Deferred = require("JQDeferred");

var _createDevice = function(){
	var device = {
		cookies: {},
		challenges: {},
		initTime: 0,
		adapterInterval: null,
		adapterCallTimes: []
	};

	device.init = function(app, beginTime){
		app = config.app; 
		var def = Deferred();
		var cookies = device.cookies;

		setTimeout(function(){
			var startTime = new Date().getTime();
			reach().then( function(cookieString){
				cookies.jsessionId = cookieString[0].split(";")[0];
				return initUnauthorized(app, cookies);
			})
			.then( function (cookieString, allChallenges){
				device.challenges = allChallenges;
				cookies.wlpersistentCookie = cookieString[0].split(";")[0];
				return init(app, cookies, device.challenges);
			})
			.then( function (a){
				device.initTime = (new Date().getTime()) - startTime;
				console.log(device.initTime);
				def.resolve();
			});
		}, beginTime);

		return def; 
	}

	device.invokeAdapter = function(app, adapter){
		var app = config.app;
		var adapter = config.adapter;
		var cookies = device.cookies;
		var challenges = device.challenges;
		var frequency = adapter.frequency;

		device.adapterInterval = setInterval(function(){
			var startTime = new Date().getTime();

			invokeAdapter(app, adapter, cookies, challenges).then(function(){
				device.adapterCallTimes.push(new Date().getTime() - startTime);
			});
		}, frequency);
	}

	device.initAdapterCall = function(startTime){
		setTimeout(function(){
			device.init().then(function(){
				return device.invokeAdapter();
			}).then(function(){
				console.log("ALL COMPLETE");
			});
		}, startTime);
	}

	return device;
}

function reach(app){

	/*
		TODO: User Agent
	*/
	var def = Deferred();

	// An object of options to indicate where to post to
	var get_options = {
		host: config.host,
		port: config.port,
		path: config.contextRoot + "/apps/services/reach",
		method: 'GET',
		headers: {
			'Connection': 'keep-alive',
			'Accept-Encoding': 'gzip, deflate',
			'User-Agent': "",
			'Accept-Language': 'en-us',
			'Accept': "*/*"
		}
	};

	// Set up the request
	http.get(get_options, function(res) {
		res.setEncoding('utf8');

		var setCookie = res.headers["set-cookie"];
		def.resolve(setCookie);
	});

	return def.promise();
}

function initUnauthorized(app, cookies){
	/*
		TODO: 	App environment
				User Agent
				Cookie
				Random Number
	*/
	var def = Deferred();

	var post_data = querystring.stringify({
		'skin': 'default',
		'skinLoaderChecksum': '',
		'__wl_deviceCtxVersion': '-1',
		'__wl_deviceCtxForce': "true",
		'isAjaxRequest': 'true',
		'x': 0.6439556962687188
	});

	// An object of options to indicate where to post to
	var post_options = {
		host: config.host,
		port: config.port,
		path:  config.contextRoot + "/apps/services/api/" + app.name + "/" + app.environments[0] + "/init",
		method: 'POST',
		headers: {
			'Accept-Language': 'en-US',
			'User-Agent': "Mozilla/5.0 (iPad; CPU OS 6_1 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Mobile/10B141 (157672832)/Worklight/6.0.5.00.20130906-1517",			
			'x-wl-platform-version': config.wlPlatformVersion,
			'X-Requested-With': 'XMLHttpRequest',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'x-wl-app-version': app.version,
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
			'Connection': 'keep-alive',
			'Cookie': cookies.jsessionId,
			'Content-Length': post_data.length,
			'Origin': 'file://',
			'Accept-Encoding': 'gzip, deflate'
		} 
	};	

	// Set up the request
	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');
		var setCookie = res.headers["set-cookie"];

		res.on('data', function (data) {
			data = data.replace("/*-secure-", "");
			data = data.replace("*/", "");

			var challenges = JSON.parse(data);
			def.resolve(setCookie, challenges);
		});
	});

	// post the data
	post_req.write(post_data);
	post_req.end();

	return def.promise();
}

function init(app, cookies, challenges){
	/*
		TODO: 	App environment
				User Agent
				Cookie
				Random Number
				device os, model, environment
	*/
	var def = Deferred();

	var wlInstanceId = challenges["challenges"]["wl_antiXSRFRealm"]["WL-Instance-Id"];
	var wlDeviceNoProvisioningRealmToken = challenges["challenges"]["wl_deviceNoProvisioningRealm"]["token"];

	var authorization = {
		"wl_deviceNoProvisioningRealm":{
			"ID":{
				"token": wlDeviceNoProvisioningRealmToken,
				"app":{
					"id":app.name,
					"version":app.version
				},"device":{
					"id":uuids[Math.floor(Math.random() * uuids.length)],
					"os":"6.1",
					"model":"x86_64",
					"environment":"iphone"
				},
				"custom":{}
			}
		}
	};

	var post_data = querystring.stringify({
		'skin': 'default',
		'skinLoaderChecksum': '',
		'__wl_deviceCtxVersion': '-1',
		'__wl_deviceCtxForce': "true",
		'isAjaxRequest': 'true',
		'x': 0.6439556962687188
	});

	// An object of options to indicate where to post to
	var post_options = {
		host: config.host,
		port: config.port,
		path:  config.contextRoot + "/apps/services/api/" + app.name + "/" + app.environments[0] + "/init",
		method: 'POST',
		headers: {
			'Accept-Language': 'en-US',
			'WL-Instance-Id': wlInstanceId,
			'User-Agent': "Mozilla/5.0 (iPad; CPU OS 6_1 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Mobile/10B141 (157672832)/Worklight/6.0.5.00.20130906-1517",			
			'x-wl-platform-version': config.wlPlatformVersion,
			'X-Requested-With': 'XMLHttpRequest',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'x-wl-app-version': app.version,
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
			'Connection': 'keep-alive',
			'Cookie': cookies.wlpersistentCookie + ';' + cookies.jsessionId,
			'Content-Length': post_data.length,
			'Origin': 'file://',
			'Accept-Encoding': 'gzip, deflate',
			'Authorization': JSON.stringify(authorization)
		} 
	};	

	// Set up the request
	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			def.resolve();
		});
	});

	// post the data
	post_req.write(post_data);
	post_req.end();

	return def.promise();
}

function invokeAdapter(app, adapter, cookies, challenges){
	/*
		TODO: 	App environment
				User Agent
				Cookie
				Random Number
				device os, model, environment
	*/

	var def = Deferred();

	var post_data = querystring.stringify({
		adapter: adapter.name,
		procedure: adapter.procedure,
		parameters: adapter.parameters,
		isAjaxRequest: "true",
		x: 0
	});

	var wlInstanceId = challenges["challenges"]["wl_antiXSRFRealm"]["WL-Instance-Id"];

	// An object of options to indicate where to post to
	var post_options = {
		host: config.host,
		port: config.port,
		path:  config.contextRoot + "/apps/services/api/" + app.name + "/" + app.environments[0] + "/query",
		method: 'POST',
		headers: {
			'Accept-Language': 'en-US',
			'WL-Instance-Id': wlInstanceId,
			'User-Agent': "Mozilla/5.0 (iPad; CPU OS 6_1 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Mobile/10B141 (157672832)/Worklight/6.0.5.00.20130906-1517",			
			'x-wl-platform-version': config.wlPlatformVersion,
			'X-Requested-With': 'XMLHttpRequest',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'x-wl-app-version': app.version,
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
			'Connection': 'keep-alive',
			'Cookie': cookies.wlpersistentCookie + ';' + cookies.jsessionId,
			'Content-Length': post_data.length,
			'Origin': 'file://',
			'Accept-Encoding': 'gzip, deflate'
		} 
	};	

	// Set up the request
	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (data) {
			def.resolve();
		});
	});

	// post the data
	post_req.write(post_data);
	post_req.end();

	return def;
}


module.exports = {
	createDevice: _createDevice
};

