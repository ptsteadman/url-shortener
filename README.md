# URL Shortener (in Node.js)

### Overview

URL shorteners work by a server performing a redirect from (ex.) http://short.ly/shortId to a longer URL stored in a database.  

Features:
  - Custom shortlinks (ex short.ly/custom instead of short.ly/123asd)
  - Logging of hits, including user ip / referrer
  - GUI for internal creation of shortlinks, and browsing of stats
  - RESTful API allows for programmatic creation of shortlinks
  - Seperation of database from webserver

This URL shortener consists of two node servers:
  - **Shortener-API**, which is an API for adding, removing, and viewing shortlinks.  Shortener-API also provides a GUI.
  - **Shortener-WEB**, which actually performs the shortlink redirect by calling Shortener-API.


         +----------------------+               +----------------+
         |SHORTENER-API         |               |SHORTENER-WEB   |
         |----------------------|               |----------------|
         | http://internal:3000 | 2.calls API   | http://short.ly|
         |                      <---------------+                |
         | provides GUI for     |   "foo"       | only performs  |
         | adding and removing  +---------------> redirects      |
         | shortlinks, viewing  | 4. returns    |                |
         | stats                |  "bar.com"    |                |
         |                      |               |                |
         +--------+--^----------+               +----^------+----+
               3. |  | looks up shortlink            |      |
                  |  | logs hit                      |      | 5. redirects
            ------v--+-------                        |      | to "bar.com"
          +-------------------+                      |      |
          | shortener MYSQL   |     1. user requests |      |
          |  - shortlinks     |        short.com/foo +  0   v
          |  - shortlink_hits |                        -+-
          |                   |                         |
          +-------------------+                        / \
            -----------------

## Database Setup

- Install MySql, and start a mysql shell using sudo in the shorty-api directory.
- Create a database called "shortener" with the command "CREATE DATABASE shortener".
  (A different database name can be used by modifying 'mysqlDB' in shortener-api's config.js).
- Finally, use the command "SOURCE links.sql" to create the proper tables in MySQL.
  (To view the schema of the tables being created, you can view the links.sql file). 

## Configuration and Startup

The two node servers, Shortener-API and Shortener-WEB, are configured in the config.js files in each directory.

**Shortener-API config.js**

    exports.config = {
            mysqlHost: "localhost",
            mysqlPort: "3306",
            mysqlUser: "root",
            mysqlPassword: "",
            mysqlDB: "shortener",

            domain: 'http://localhost:3001',  //  domain and port where the shortener-api is running
            redirectDomain: 'http://localhost:3002'  // (ex. bit.ly/) public facing domain where shortener-web is running
    } 

**Shortener-WEB config.js**

    exports.config = {
      host: "localhost",  // the domain where the shorterner-api is running
      port: "3001",  // the port where the shortener-api is running
      path: "/v1/shortlink/",  // api root (should not need to change)
      errorRedirect: "http://www.google.com" // where the user is sent if a shortlink isn't found
    }

To use the shortener, start both shortner-API and shortener-WEB with "node app.js" in each directory.  

By default, shortener-API runs on http://localhost:3001 and shortener-WEB runs on http://localhost:3002.  This means that shortlinks will look like http://localhost:3002/shortId, and the GUI can be accessed from the browser at http://localhost:3001

## Shortener-API Methods

### POST /v1/shortlink

Accepts a JSON object that defines a new shortlink to be added to the database of redirects.  If a customId is provided and is not currently in the database, the shortId of the shortlink is set to that customId.  If customId is not provided, shorty generates a unique shortId.

#### example request: create link from http://short.com/bar -> http://example.com/foo

    {
      "url": "http://example.com/foo",
      "customId": "bar",
      "username": "patrick"
    }

### POST /v1/shortlink/:shortId/hits

**Shortlink lookup WITH logging.**

Appends an access log record defined by a JSON object that specifies the  the client's ip address and referer.  The ip address and referer are passed on to the API by the shorty-web app.

Also returns the URL corresponding to the shortId, or a not found error.  This URL is then used by the shorty-web app to provide a redirect.

#### example request

    {
      "ip": "192.168.0.1",
      "referer": "http://expedia.com/"
    }

#### response

  "http://example.com/foo"

### GET /v1/shortlink/:shortId

**Shortlink lookup without logging.**

Given a shortId as a parameter, returns the corresponding URL **without** logging an access IP, time, and referer.

### GET /v1/shortlink

Get a JSON encoded array of all shortlinks.

### GET /v1/shortlink/:shortId/hits

Retrieves the hit log for the specified shortId as a JSON document. 

### DELETE /v1/shortlink/:shortId

Deletes the shortlink with the given shortId.
