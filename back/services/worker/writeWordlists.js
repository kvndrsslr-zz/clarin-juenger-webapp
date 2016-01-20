var fs = require('fs');


exports.writeWordlists = function () {
    return (function (data) {
        console.log('Writing files...');
        data.forEach(function(wordlist) {
            fs.writeFileSync("front/misc/data/" + wordlist.name + ".json", JSON.stringify(wordlist));
        });
    });
};