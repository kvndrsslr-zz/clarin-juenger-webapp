var fs = require('fs');


exports.writeWordlists = function () {
    return (function (data) {
        console.log('Writing files...');
        data.forEach(function(wordlist) {
            var file = '';
            for (var i = 0; i < wordlist.list.length; i++) {
                file += wordlist.list[i].word + "\t" + wordlist.list[i].freq + '\n';
            }
            fs.writeFileSync("front/misc/data/" + wordlist.corpus.name + ".txt", file);
        });
    });
};