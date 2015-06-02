var Q = require('q');

var schemes = [];
var schemesUrl = 'http://clarinws.informatik.uni-leipzig.de:8080/wordlistwebservice/wordlist/availableWordlists';

exports.corporaSchemesWs = function (tunnel, qRequest) {
    if (schemes.length === 0) {
        return Q()
             //tunnel.qConnect()
            .then(qRequest.bind(null, schemesUrl))
            .then(function (response) {
                //tunnel.close();
                console.log(response);
                var lines = response.split('\n');
                lines.forEach(function (line) {
                    var i = line.indexOf('\t');
                    var name = line.substring(0, i);
                    var description = line.substring(i+1);
                    schemes.push(name);
                });
                return schemes;
            });

    } else {
        return schemes;
    }
};