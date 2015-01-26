var Tunnel = require('tunnel-ssh');
var Q = require('q');
var portfinder = require('portfinder');



exports.config = function () {
    var deferred = Q.defer();
    var config = require('cjson').load('back/config.json');
    portfinder.basePort = Math.floor((Math.random() * 6000) + 3000);
    portfinder.getPort(function(err, port) {
        config.tunnel.tunnelPort = port;
        //config.tunnel.tunnelPort = 8080;
        //console.log('Tunneling MySQL traffic through :' + port);
        deferred.resolve(config);
    });
    return deferred.promise;
};

var tunnels = [];


process.on('SIGINT', function() {
    console.log('About to exit, trying to close opened tunnels...');
    tunnels.forEach(function (tunnel) {
        try {
            tunnel.close();
            console.log("Successfully closed tunnel on :" + tunnel.port);
        } catch (e) {
            console.log("Already closed tunnel on :" + tunnel.port);
        }
    });
    process.exit();
});


exports.tunnel = function (config) {

    var tunnel = new Tunnel({
        "remoteHost": config.mysql.host,
        "remotePort": config.mysql.port,
        "localPort": config.tunnel.tunnelPort,
        "verbose": true,
        "disabled": false,
        "sshConfig": {
            "host": config.tunnel.host,
            "port": config.tunnel.port,
            "username": config.tunnel.username,
            "password": config.tunnel.password
        }
    });

    tunnel.port = config.tunnel.tunnelPort;

    tunnels.push(tunnel);

    tunnel.qConnect = function () {
        var deferred = Q.defer();
        tunnel.connect(function (err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise
    };




    return tunnel;
};




