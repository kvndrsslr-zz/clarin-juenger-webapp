var Q = require('q');
var fs = require('fs');
var crypto = require('crypto');

exports.getWordlistsDwds = function (params, tunnel, qRequest) {
    return (function () {
        return tunnel.qConnect()
            .then(function () {

                var x = {},
                    chain = Q(),
                    baseUrl = "http://kaskade.dwds.de/dstar/kern/query?q=",
                    yMin = 1919,
                    yMax = 1919,//yMax = 1933,
                    predicates = ['#has[textClass,/^Zeitung/]'],
                    sliceSize = 100,
                    maxSize = 300,
                    timeoutInterval = 2*1000;
                // timeoutEach = 5000;

                for (var y = yMin; y <= yMax; y++) {
                    predicates.forEach(function (p) {
                        for (var i = 0; i <= maxSize; i += sliceSize) {
                            var url = baseUrl + encodeURIComponent("* " + p + " #asc_date[" + y + "-00-00, " + y + "-99-99]")+"&start="+(i+1)+"&limit="+(i+sliceSize);
                            console.log("chaining " + url);
                            chain = chain.then(retrieveText.bind(null, url));//.then(Q().delay(timeoutInterval));
                        }
                    })
                }

                chain = chain.then(function () {
                    fs.writeFileSync("front/misc/data/dwds_test.json", JSON.stringify(x));
                 });

                return chain;

                function retrieveText (url) {
                    console.log("retrieving: " + url);
                    return Q().then(qRequest.bind(null, url)).then(function (data) {
                        // Extrahiere Klartext
                        // Schreibe in Array dies Objekt: {text: text, titel: titel, date: date, hash: sha1(autor + titel + jahr)}
                        // Wenn Hash schon in Array vorhanden wird text nur angehängt.
                        // Gute Buffered Strategie zum Herausschreiben überlegen; um Speicherverbrauch gering zu halten
                        // Möglichkeit 1: direktes Herausschreiben in Datei mit Hash als Namen; dann einfach concat über alle Dateien.
                        //          Vorteil: Metadaten nur beim ersten Finden eines Titels interessant.
                        // Möglichkeit 2: Wenn Ergebnisse von DWDS bereits geordnet sind wird obiger Ansatz
                        //          trivialerweise zum Anhängen des Textes in eine einzige Datei
                        console.log("retrieved:" + typeof data);
                        data = JSON.parse(data);
                        console.log("transformed:" + typeof data);
                        var hits = data.hits_.map(function (hit) {
                            var hash = crypto.createHash('sha1');
                            var meta = {
                                author: hit.meta_.author,
                                title: hit.meta_.title,
                                date: hit.meta_.date
                            };
                            hash.update(JSON.stringify(meta), 'utf8');
                            return {
                                hash: hash.digest('hex'),
                                meta: meta,
                                text: hit.ctx_[1]
                                    .map(function (w) {
                                        return w[1];
                                    }).reduce(function (a, b) {
                                        return a + " " + b;
                                    },"")
                            };
                        });
                        var lHash = "";
                        //console.log(hits);
                        // iteriere durch hits
                        hits.forEach(function (hit) {
                            console.log("hit:" + hit.hash);
                            if (x[hit.hash] || hit.hash === lHash) {
                                x[hit.hash].text += " " + hit.text;
                            } else {
                                x[hit.hash] = hit;
                            }
                            lHash = hit.hash;
                        });
                        return true;
                    }).fail(function (error) {
                        console.log("error:" + error);
                    });
                }

            });
    });

};