exports.config = {
        mysqlHost: "localhost",
        mysqlPort: "3306",
        mysqlUser: "root",
        mysqlPassword: "",
        mysqlDB: "shortener",

        domain: 'http://localhost:3001',  //  domain and port where the shortener-api is running
        redirectDomain: 'http://localhost:3002'  // (ex. bit.ly/) public facing domain where shortener-web is running
}