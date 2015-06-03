var Q = require('q');
var fs = require('fs');
var crypto = require('crypto');

exports.getWordlistsDwds = function (params, tunnel, qRequest) {
    return (function () {
        return tunnel.qConnect()
            .then(function () {

                var chain = Q(),
                    baseUrl = "http://kaskade.dwds.de/dstar/kern/query?q=",
                    yMin = 1919,
                    yMax = 1919,//yMax = 1933,
                    predicates = ['#has[textClass,/^Zeitung/]'],
                    sliceSize = 10,
                    maxSize = 20,
                    timeoutInterval = 2*1000;
                // timeoutEach = 5000;

                for (var y = yMin; y <= yMax; y++) {
                    predicates.forEach(function (p) {
                        for (var i = 0; i <= maxSize - sliceSize; i += sliceSize) {
                            var url = baseUrl + encodeURIComponent("* " + p + " #asc_date[" + y + "-00-00, " + y + "-99-99]")+"&start="+(i+1)+"&limit="+(sliceSize);
                            console.log("chaining " + url);
                            chain = chain.then(retrieveText.bind(null, url)).then(Q().delay(timeoutInterval));
                        }
                    })
                }

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
                                date: hit.meta_.date_
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
                        console.log(hits);
                        // iteriere durch hits
                        var y = hits[0].meta.date.substring(0, hits[0].meta.date.indexOf('-'));
                        var wstream = fs.createWriteStream('front/misc/data/dwds/' + y + '.xml');
                        hits.forEach(function (hit) {
                            console.log("hit:" + hit.hash);
                            if (hit.hash !== lHash) {
                                // write meta heading
                                wstream.write('\n <source><location>' + hit.meta.author+ ':' + hit.meta.title +
                                '</location><date>' + hit.meta.date + '</date></source>');
                            }
                            //append text
                            wstream.write(hit.text);
                            lHash = hit.hash;
                        });
                        wstream.end();
                        return true;
                    }).fail(function (error) {
                        console.log("error:" + error);
                    });
                }

            });
    });

};