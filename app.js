var gplay = require('google-play-scraper');
var express = require('express')
var cluster = require('cluster');
var http = require('http');
var logger = require("./logger");

var app = express()
var numCPUs = require('os').cpus().length;

var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs')
var binPath = phantomjs.path


var request = require('request');


app.use(require("morgan")("combined", { "stream": logger.stream }));
app.get('/getAppInfo', function(req, res) {
    if (!req.query || !req.query.id) return res.send({ msg: "app id can not empty" })

    gplay.app({ appId: req.query.id || 'com.dxco.pandavszombies', lang: req.query.lang || "en", country: req.query.country || "us" })
        .then(function(app) {
            console.log('worker' + cluster.worker.id);
            res.send(app);
        })
        .catch(function(e) {
            res.send({
                status: "error",
                message: "the app id is not valid"
            });
            logger.error("url:" + req.url + ", satusCode:" + res.statusCode + ",the app id is not valid")
        });
})


app.get('/getFinalSpiderHtml', function(req, res) {
    var url = req.query.url || "http://global.ymtracking.com/trace?offer_id=116686&aff_id=1&aff_sub=unlock%40%4056f33980e4b0f048710723e4&android_id=375dec1f7a6c588e";
    var childArgs = [
        path.join(__dirname, 'phantomjs-script.js'),
        url
    ]
    childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
        request(stdout, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(response.headers) // Show the HTML for the Google homepage. 
            }
            response.headers['statusCode'] = response.statusCode
            res.send({
                html:body,
                headers:response.headers
            });
        })
    })




})




app.use(function(req, res, next) {
    res.status(404).send("Sorry, page not found");
});

if (cluster.isMaster) {
    console.log('[master] ' + "start master...");

    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('listening', function(worker, address) {
        console.log('[master] ' + 'listening: worker' + worker.id + ',pid:' + worker.process.pid + ', Address:' + address.address + ":" + address.port);
    });

} else if (cluster.isWorker) {
    console.log('[worker] ' + "start worker ..." + cluster.worker.id);
    app.listen(8888);
}
