var fs = require('fs');


exports.writeWordlists = function (tunnel) {
    return (function (data) {
        console.log('Closing ssh tunnel...');
        tunnel.close();
        console.log('Writing files...');
        data.forEach(function(wordlist) {
            var file = '';
            for (var i = 0; i < wordlist.length; i++) {
                file += wordlist[i].word + "\t" + wordlist[i].freq + '\n';
            }
            fs.writeFileSync("data/" + wordlist.corpus + ".txt", file);
        });
    });
};