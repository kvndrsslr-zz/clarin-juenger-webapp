var fs = require('fs');
var Q = require('q');

var schemes = [];

exports.corporaSchemes = function (tunnel, db) {
    if (schemes.length === 0) {
        return tunnel.qConnect()
            .then(function () {
                return db.getConnection('information_schema')
                    .then (function (connection) {
                    return Q.ninvoke(connection, "query", "SELECT SCHEMA_NAME AS 'DATABASE' FROM SCHEMATA WHERE SCHEMA_NAME <> 'information_schema' ")
                        .then(function(data) {
                            var result = [];
                            data[0].forEach(function(row) {
                                result.push(row.DATABASE);
                            });
                            connection.release();
                            tunnel.close();
                            schemes = result;
                            return result;
                        })
                        .fail(function (error) {
                            console.log(error);
                            tunnel.close();
                            return {failure: true};
                        });
                });
            });
    } else {
        return schemes;
    }
};