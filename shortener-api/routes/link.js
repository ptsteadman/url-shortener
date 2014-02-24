var mysqldb = require('../mysqldb'),
	config = require('../config').config,
	shortId = require('shortid'),
	nurl = require('url'),
	util = require('util');

var db = mysqldb.createMysqlDb(config);

function parseUrl(url){
	var urlObj = nurl.parse(url, false, true);
	if(urlObj.protocol == null)	{
		url = "http://" + url;
		urlObj = nurl.parse(url, false, true);
	}
	return nurl.format(urlObj);
}

function logRedirect(link, ip, referer){
	var access = { 'shortlink_id': link.shortlink_id, 'client_ip_address': ip, 'referer': referer, 'access_time': new Date()};
	db.logRedirect(access, function(error, result){
		if(error) return console.log(error);
		if(result.affectedRows == 1){
			console.log('Access logged: shortId ' + link.shortlink_id);
		}
	})
}

function addUsingShortId(req, res){
	if(!req.body.url) {
		res.send({error: 'Url cannot be empty.'});
	} else{
		try {
			var url = parseUrl(req.body.url);
			db.getLinkByURL(url, function(error, rows){
				var short_id = shortId.generate();
				var link = {'shortlink_id': short_id, 'url': url, 'creation_user_id': req.body.username, 'creation_date_time': new Date()};
				db.saveLink(link, function(error, result){
					if(result.affectedRows == 1){
						if(rows.length > 0){  // link to this url already existed
							var existingLink = rows[0];
							res.send({result: util.format('%s/%s',config.redirectDomain, link.shortlink_id),
									  warning: '<strong>Warning:</strong> Link to this URL already existed: ' + config.redirectDomain + '/' + existingLink.shortlink_id});
						} else {
							res.send({result: util.format('%s/%s',config.redirectDomain, link.shortlink_id)});
						}
					} else {
						res.send({error: "Error adding link to database."})
					}
				});
			});
		} catch(error){
			console.log('Adding link failed, exception: %s %s', error.message, error.stack);
			res.send({error: "Exception occured, failed to shorten link."});
		}
	}
}

function addCustom(req, res){
	console.log('addcustom')
	if(!req.body.url) {
		res.send({error: 'Url cannot be empty.'});
	} else if (req.body.customId == '') {
		res.send({error: 'CustomId cannot be empty.'})
	} else {
		try{
			var url = parseUrl(req.body.url);
			var customId = req.body.customId;
			db.getLinkByShortId(customId, function(error, rows){
				if(rows.length > 0){
					var link = rows[0];
					res.send({error: 'Link using this shortId already exists, link is to: ' + link.url});
				} else {
					db.getLinkByURL(url, function(error, rows){
						var link = {'shortlink_id': customId, 'url': url, 'creation_user_id': req.body.username, 'creation_date_time': new Date()};
						db.saveLink(link, function(error, result){
							if(result.affectedRows == 1){
								if(rows.length > 0){  // link to this url already existed
									var existingLink = rows[0];
									res.send({result: util.format('%s/%s',config.redirectDomain, link.shortlink_id),
											  warning: '<strong>Warning:</strong> Link to this URL already existed: ' + config.redirectDomain + '/' + existingLink.shortlink_id});
								} else {
									res.send({result: util.format('%s/%s',config.redirectDomain, link.shortlink_id)});
								}
							} else {
								res.send({error: "Error adding link to database."});
							}
						});
					});
				}
			});
		} catch(error){
			console.log('Adding link failed, exception: %s %s', error.message, error.stack);
			res.send({error: "Exception occured, failed to create custom shortened link."});
		}
	}

}

exports.add = function(req, res){
	if(req.body.customId || req.body.customId == ''){ 
		addCustom(req, res);
	} else {
		addUsingShortId(req, res);
	}
}

exports.redirect = function(req, res){
	var short_id = req.params.shortId;
	db.getLinkByShortId(short_id, function(error, rows){
		if(error || rows.length == 0){
			console.log("Could not find url for short_id %s", short_id);
			res.send({error: 'Link not found.'});
		} else {
			var link = rows[0];
			logRedirect(link, req.ip, req.headers['referer'] || '(direct)');
			res.redirect(link.url);
		}
	});
}

exports.home = function(req, res){
	db.getAllLinks(function(error, rows){
	if(error){
		console.log(error)
		res.render('index', { title: 'Shorty', links: null, redirectDomain: config.redirectDomain, user: "username", message: "Could not connect to database." });
	} else {
		if(rows.length == 0){
			res.render('index', { title: 'Shorty', links: null, redirectDomain: config.redirectDomain, user: "username", message: "Shortlink database empty." });
		} else {
			data = rows;
			res.render('index', { title: 'Shorty', links: data, redirectDomain: config.redirectDomain, user: "username", message: null });
		}
	}
	})
};

exports.getLinks = function(req, res){
	db.getAllLinks(function(error, rows){
		if(error){
			res.json({error: "Problem accessing database."});
		} else {
			res.json(rows);
		}
	})
}

exports.delete = function(req, res){
	if(!req.params.shortId){
		res.send({error: 'Need shortId to delete.'})
	} else {
		console.log('delete logs')
		db.deleteLogs(req.params.shortId, function(error, result){
			if (error) return console.log(error);
			db.deleteLink(req.params.shortId, function(error, result){
				if (error) return console.log(error);
				if(result.affectedRows == 1){
					res.send({result: req.params.shortId });
				}
			});
		});
	}
}

exports.stats = function(req, res){
	db.getLog(req.params.shortId, function(error, result){
		res.json(result);
	}) 
}

exports.lookup = function(req, res){
	var short_id = req.params.shortId;
	db.getLinkByShortId(short_id, function(error, rows){
		if(error || rows.length == 0){
			console.log("Could not find url for short_id %s", short_id);
			res.send(404, {error: 'Link not found.'});
		} else {
			var link = rows[0];
			res.send(200, link.url);
		}
	});

}

exports.access = function(req, res){
	db.getLinkByShortId(req.params.shortId, function(error, rows){
		if(error || rows.length == 0){
			console.log("Could not find url for short_id %s", short_id);
			res.send(404, {error: 'Link not found.'});
		} else {
			var link = rows[0];
			logRedirect(link, req.body.clientIp, req.body.referer);
			res.send(200, link.url);
		}
	});
}
