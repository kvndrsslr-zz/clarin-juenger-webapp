var Q = require('q');
var filter = require('filter-files');
var filename = require('filename-regex');
var fs = require('fs');
var Busboy = require('busboy');
var crypto = require('crypto');
var spawn = require('child_process').spawn;
var inspect = require('util').inspect;

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
exports.postUpload = function (params) {
    //console.log(params.req.files);
    var rand = 0;
    var path = '';
    do {
        rand = crypto.randomBytes(20).toString('hex');
    } while (fs.existsSync('uploads/' + rand));
    var busboy = new Busboy({ headers: params.req.headers });
    busboy.on('file', function (fieldname, file, filename) {
        fs.mkdirSync('uploads/' + rand);
        path = 'uploads/' + rand + '/' + filename;
        file.pipe(fs.createWriteStream(path));
    });
    busboy.on('field', function (fieldname, val) {
        params[fieldname] = val;
        console.log(fieldname + ' : ' + val);
    });
    var deferred = Q.defer();
    busboy.on('finish', function () {
        var upload = spawn('curl',
            [
                '-H', 'Content-Type:text/' + params.filetype,
                '--data-binary', '@'+path,
                '-o', path + ".list", 'http://clarinws.informatik.uni-leipzig.de:8080/wordlistwebservice/conversion/convertFrom' + (params.filetype === 'plain' ? 'Plaintext' : 'TCF')
            ],
            {
                cwd: process.cwd()
            });
        upload.on('close', function () {
            var lines = fs.readFileSync(path + ".list", {encoding: 'utf-8'});
            fs.unlinkSync(path);
            fs.unlinkSync(path + ".list");
            fs.rmdirSync('uploads/' + rand);
            var result = {
                'name' : params.name,
                'displayName' : params.displayName,
                'description' : params.displayName,
                'date' : new Date(),
                'genre' : '',
                'resourceId' : 'userDefinedFromClient',
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
                        'pos' : fields[3]
                    });
                }
            });
            fs.writeFileSync('uploads/' + params.name + ".json", JSON.stringify(result));
            deferred.resolve(result);
        });
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

exports.postResultlists = function (params) {
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