---
title: URL Shortener (in Node.js)
---

# Setup Instructions / Explanation

## Database Setup

Install MySql, and start a mysql shell using sudo in the shorty-api directory.
Create a database called "shortener" with the command "CREATE DATABASE shortener".
(A different database name can be used by modifying 'mysqlDB' in shortener-api's config.js).
Finally, use the command "SOURCE links.sql" to create the proper tables in MySQL.
(To view the schema of these tables, you can view the links.sql file).  


# Shorty URL Shortener Overview

**shorty-web**

The public-facing component of the URL shortener service.
Calls the shorty-api API to get the proper redirect link.
Host and port of the shorty-api API can be edited in config.js.

**shorty-api**

API and internal UI component of the shorty URL shortener.   


# Shortener-API Methods

# Shortlink

## GET /v1/shortlink

Get a JSON encoded array of all shortlinks.

### GET /v1/shortlink/:shortId

Given a shortId as a parameter, returns the corresponding URL **without** logging an access IP, time, and referer.

### GET /v1/shortlink/:shortId/hits

Retrieves the hit log for the specified shortId as a JSON document. 

### POST /v1/shortlink

Accepts a JSON object that defines a new shortlink to be added to the database of redirects.  If a customId is provided and is not currently in the database, the shortId of the shortlink is set to that customId.  If customId is not provided, shorty generates a unique shortId.

#### example request

    {
      "url": "http://example.com/foo",
      "customId": "bar",
      "username": "patrick"
    }

### POST /v1/shortlink/:shortId/hits

Appends an access log record defined by a JSON object that specifies the shortlink's shortId, as well as the client's ip address and referer.  The ip address and referer are passed on to the API by the shorty-web app.

Also returns the URL corresponding to the shortId, or a not found error.  This URL is then used by the shorty-web app to provide a redirect.

#### example request

	$ curl http://blah

#### example request

    {
      "ip": "192.168.0.1",
      "referer": "http://expedia.com/"
    }

#### response

	"http://example.com/foo"

### DELETE /v1/shortlink/:shortId

Deletes the shortlink with the given shortId.
