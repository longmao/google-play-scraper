var gplay = require('google-play-scraper');
var express = require('express')
var app = express()
var cluster = require('cluster');
var http = require('http');

var numCPUs = require('os').cpus().length;

app.get('/getAppInfo', function(req, res) {
    if (!req.query || !req.query.id) return res.send({ msg: "app id can not empty" })

    gplay.app({ appId: req.query.id || 'com.dxco.pandavszombies', lang: req.query.lang || "en", country: req.query.country || "us" })
        .then(function(app) {
            res.send(app);
            console.log(333)
            console.log('Retrieved application: ' + app);
        })
        .catch(function(e) {
            console.log('There was an error fetching the application!');
        });
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
    http.createServer(function(req, res) {
        console.log('worker' + cluster.worker.id);
        res.end('worker' + cluster.worker.id + ',PID:' + process.pid);
    }).listen(8888);
}