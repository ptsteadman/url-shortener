
/**
 * Module dependencies.
 */

var express = require('express');
var link = require('./routes/link');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3002);
app.use(express.logger('dev'));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', link.home);
app.get('/:shortId', link.redirect);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
