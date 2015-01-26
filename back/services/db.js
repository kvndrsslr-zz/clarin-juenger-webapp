var mysql = require('mysql');
var Q = require('q');


exports.db = function (config) {
    var pool  = mysql.createPool({
        connectionLimit : 20,
        host     : '127.0.0.1',
        port     : config.tunnel.tunnelPort,
        user     : config.mysql.user,
        password : config.mysql.password
    });
    var db = {};
    db.getConnection = function (dbName) {
        var deferred = Q.defer();
        pool.getConnection(function (err, connection) {
            if (err)
                deferred.reject(err);
            else {
                connection.changeUser({database : dbName}, function(err) {
                    if (err) throw err;
                    else deferred.resolve(connection);
                });
            }
        });
        return deferred.promise;
    };
    return db;
};