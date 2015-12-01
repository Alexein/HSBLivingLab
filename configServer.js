var mysql = require('mysql');

var hsbTitle = "HSB Dev";
var serverPort = 8082;

var dbPool = mysql.createPool({
    connectionLimit : 100,
    host     : 'localhost',
    user     : 'hsb',
    password : 'hexagon2',
    database : 'hsb',
    debug    :  false
});

module.exports = {
    dbPool: function() {
        return dbPool;
    },
    hsbTitle: function() {
        return hsbTitle;
    },
    serverPort: function() {
        return serverPort;
    }
}
