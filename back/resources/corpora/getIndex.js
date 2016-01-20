var Q = require('q');
var filter = require('filter-files');
var filename = require('filename-regex');
var fs = require('fs');
var Busboy = require('busboy');
var crypto = require('crypto');
var spawn = require('child_process').spawn;

exports.getIndex = function (resourceManager) {
    return Q()
        .then(resourceManager.action('corpora'))
        .then(function (corpora) {
            return {corpora : corpora};
        });
};

exports.post = function (workloadManager, matrixWorkload) {
    var id = workloadManager.id(matrixWorkload);
    var result = workloadManager.retrieve(id);
    if (result) {
        result.resolved = true;
        result.requestId = id;
        return result;
    } else if (typeof result === 'undefined') {
        workloadManager.enqueue(matrixWorkload);
        return {requestId: id};
    } else {
        return {requestId: id};
    }
    return result;
};
exports.postTest = function (params, qPost) {
    //console.log(params.req.files);
    var rand = 0;
    var path = '';
    do {
        rand = crypto.randomBytes(20).toString('hex');
    } while (fs.existsSync('uploads/' + rand));
    var busboy = new Busboy({ headers: params.req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        fs.mkdirSync('uploads/' + rand);
        path = 'uploads/' + rand + '/' + filename;
        file.pipe(fs.createWriteStream(path));
    });
    var deferred = Q.defer();
    busboy.on('finish', function () {
        var upload = spawn('curl',
            [
                '-H', 'Content-Type:text/plain',
                '--data-binary', '@'+path,
                '-o', path + ".list", 'http://clarinws.informatik.uni-leipzig.de:8080/wordlistwebservice2/conversion/convertFromPlaintext'
            ],
            {
                cwd: process.cwd()
            });
        upload.on('close', function (code) {
            console.log(code);
            var lines = fs.readFileSync(path + ".list", {encoding: 'utf-8'});
            var result = {
                'name' : path,
                'displayName' : params.name,
                'description' : '',
                'date' : new Date(),
                'genre' : fields[4].trim(),
                'resourceId' : 'userdefinedFromClient',
                'words' : []
            };
            lines.split('\n').forEach(function (line) {
                if (line) {
                    var fields = line.split('\t');
                    result.words.push({
                        'wId' : fields[0],
                        'word' : fields[1],
                        'absFreq' : fields[2],
                        'rank' : fields[0],
                        'pos' : 'X'
                    });
                }
            });
            deferred.resolve(result);
        });
        //var form = {
        //    file: fs.createReadStream(path)
        //};
        //qPost('http://aspra11.informatik.uni-leipzig.de:8080/wordlistwebservice2/conversion/convertFromPlaintext', form, {'Content-Type' : 'text/plain'})
        //    .then(function (data) {
        //        console.log(data);
        //    });
    });
    params.req.pipe(busboy);
    return deferred.promise;
};


exports.postRequest = function (params, workloadManager) {
    var result = workloadManager.retrieve(params.requestId);
    if (result) {
        //console.log(result);
        return result;
    } else {
        return {progress: workloadManager.progress(params.requestId)};
    }
};

exports.postImages = function (params) {

    var list = filter.sync('front/misc/data', function (x) {
        return new RegExp(params.regex).test(x);
    }).map(function (x) {
        var match = x.match(filename());
        return match[0];
    });
    return {'files': list};
};

exports.postResultlists = function (params, resourceManager) {

    var result = {'error' : true};
    var req = params.request;
    var regex = new RegExp("result_" +
        req.wordCount + "_" +
        req.metric + "_" +
        "(("  + req.corpora[0].name + "_" + req.corpora[1].name +
        ")|(" + req.corpora[1].name + "_" + req.corpora[0].name + ")){1}\\.json$");
    filter.sync('front/misc/data', function (x) {
        return regex.test(x);
    }).map(function (file) {
        var fp = JSON.parse(fs.readFileSync(file, {encoding: 'utf-8'}));
        result = fp;
    });
    console.log("Returning wordlists for \n\t source: " + result.source.displayName + "\n\t target: " + result.target.displayName );
    return result;
};