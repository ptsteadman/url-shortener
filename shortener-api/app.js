var express = require('express');
var link = require('./routes/link');
var http = require('http');
var path = require('path');
var config = require('./config').config;
var app = express();

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

var ejs = require('ejs'); ejs.open = '<@'; ejs.close = '@>';

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', link.home);  // show UI
app.get('/v1/', function(req, res){ res.sendfile(__dirname + "/public/docs/v1.html"); });
app.get('/v1/shortlink', link.getLinks);  //  get all shortlinks 
app.get('/v1/shortlink/:shortId', link.lookup);  // lookup a shortid without logging the access
app.get('/v1/shortlink/:shortId/hits', link.stats);  // get complete access logs for a shortId
app.post('/v1/shortlink', link.add);  // create new shortlink, accepts json  
app.post('/v1/shortlink/:shortId/hits', link.access);  // return a shortid and log a ip/referer
app.delete('/v1/shortlink/:shortId', link.delete);  // delete a shortlink


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
