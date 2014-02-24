var	config = require('../config').config;
var http = require('http');


exports.home = function(req, res){
	res.redirect(config.errorRedirect);
}

exports.redirect = function(request, response){
	console.log(request.headers['referer']);
	var access = JSON.stringify({
									clientIp: 		request.ip,
									referer: 	request.headers['referer'] || '(direct)' });

	var options = {
		host: config.host,
		port: config.port,
		path: config.path + request.params.shortId + "/hits",
		method: "POST",
		headers: {
       		"Content-Type": "application/json",
        	"Content-Length": access.length 
    	}
	}
	var req = http.request(options, function(res){
		res.setEncoding('utf8');
		res.on('data', function(url){
			response.redirect(url);
		})
	})
	
	req.on('error', function(error){
		response.redirect(config.errorRedirect);
	})
	req.end(access);
}
