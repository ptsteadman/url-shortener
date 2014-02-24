exports.config = {
	host: "localhost",  // the domain where the shorterner-api is running
	port: "3001",  // the port where the shortener-api is running
	path: "/v1/shortlink/",  // api root (should not need to change)
	errorRedirect: "http://www.google.com" // where the user is sent if a shortlink isn't found
}
