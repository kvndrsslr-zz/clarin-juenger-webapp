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
                    var fields = line.split('\t');
                    schemes.push({
                        name :        fields[0],
                        displayName:  fields[1],
                        description:  fields[2],
                        date:         fields[3],
                        genre:        fields[4]
                    });
                });
                return schemes;
            });
    } else {
        return schemes;
    }
};