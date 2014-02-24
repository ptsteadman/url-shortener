var mysql = require('mysql');

function handleDisconnect(self, connection){
	connection.on('error', function(err){
		if(!err.fatal){
			return;
		}
		if(err.code !== 'PROTOCOL_CONNECTION_LOST'){
			throw err;
		}
		console.log('Reconnecting lost connection: ' + err.stack);
		self.connection = mysql.createConnection(connection.config);
		handleDisconnect(self, self.connection);
		self.connection.connect();
	});
}

function MysqlDb(config){
	var connection = mysql.createConnection({
		host		: config.mysqlHost,
		user		: config.mysqlUser,
		port		: config.mysqlPort,
		password	: config.mysqlPassword,
		database	: config.mysqlDB
	});
			handleDisconnect(this, connection);
	try{
		connection.connect();
		this.connection = connection;
	} catch(error){
		console.log("Error connecting to MySQL database:" + error);
	}
}

MysqlDb.prototype.saveLink = function(link, callback){
	this.connection.query('INSERT INTO shortlinks SET ?', link, callback);
}

MysqlDb.prototype.deleteLink = function(shortId, callback){
	this.connection.query('DELETE FROM shortlinks WHERE shortlink_id = ?', shortId, callback);
}

MysqlDb.prototype.deleteLogs= function(shortId, callback){
	this.connection.query('DELETE FROM shortlink_hits WHERE shortlink_id = ?', shortId, callback);
}

MysqlDb.prototype.getLinkByShortId = function(shortId, callback){
	this.connection.query('SELECT * FROM shortlinks WHERE shortlink_id = ?', shortId, callback);
}

MysqlDb.prototype.getLinkByURL = function(url, callback){
	this.connection.query('SELECT * FROM shortlinks WHERE url = ?', url, callback);
}

MysqlDb.prototype.getAllLinks = function(callback){
	this.connection.query('SELECT shortlinks.shortlink_id, shortlinks.url, shortlinks.creation_user_id, shortlinks.creation_date_time, counts.hits FROM shortlinks LEFT JOIN (SELECT shortlink_id, count(*) AS hits FROM shortlink_hits GROUP BY shortlink_id) AS counts ON counts.shortlink_id = shortlinks.shortlink_id ORDER BY shortlinks.creation_date_time DESC;', callback);
}

MysqlDb.prototype.logRedirect = function(access, callback){
	this.connection.query('INSERT INTO shortlink_hits SET ?', access, callback);
}

MysqlDb.prototype.getLog = function(shortId, callback){
	this.connection.query('SELECT * FROM shortlink_hits WHERE shortlink_id = ?;', shortId, callback);
}

exports.createMysqlDb = function(config){
	return new MysqlDb(config);
}