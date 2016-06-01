var gplay = require('google-play-scraper');
var express = require('express')
var cluster = require('cluster');
var http = require('http');
var logger = require("./logger");
var util = require("./util/util.js")();
var app = express()
var numCPUs = require('os').cpus().length;
var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs-prebuilt')
var binPath = phantomjs.path

var request = require('request').defaults({ maxRedirects: 50 });

require('events').EventEmitter.defaultMaxListeners = 0;


var http = require('http');
var websocket_server = require('websocket').server



app.use(require("morgan")("combined", { "stream": logger.stream }));


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
    app.listen(process.env.port || 8888);
}


var socket = new websocket_server({
    httpServer: http.createServer().listen(1337)
});

var Promise = require('bluebird');
var redis = require("redis"),
    client = redis.createClient();
var appList = require('./util/appList.js')()
client.set("scrawListStatus", "ready");

app.get('/getAppListInfo', function(req, res) {
    client.get("scrawListStatus", function(err, reply) {
        util.scrawListStatus = reply.toString()
        console.log(util.scrawListStatus)
        console.log('worker' + cluster.worker.id);
        if (util.scrawListStatus === "scrawling" || util.scrawListStatus === "finished") return
        client.set("scrawListStatus", "scrawling");
        appList
            .getAppList()
            .then(function(obj) {
                client.set("scrawListStatus", "finished");
                var appendStr = JSON.stringify(obj)
                util.writeData("./file/top_category_500.json", "", "", function() {
                    util.appendData("./file/top_category_500.json", appendStr, "save top 500 app")
                })
                res.send(obj)

            });
    });

})

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
var connection;
socket.on('request', function(request) {

    connection = request.accept(null, request.origin);

    connection.on('message', function(message) {
        console.log(message)
        if (message.utf8Data === "startCrawl") {
            util.startCrawl(function(data) {
                connection.sendUTF(data);
            })
        }


    });

    connection.on('close', function(connection) {
        console.log("close")
        console.log('connection closed');
    });
});



app.get('/getAppInfoFromFile', function(req, res) {
    var ua = req.headers && req.headers['user-agent'] || "";
    if (util.is_from_browser(ua)) {
        res.sendFile('index.html', { root: __dirname }, function() {

        })

    } else {
        util.startCrawl()
    }





})
app.get('/getFinalSpiderHtml', function(req, res) {
    var url = req.query.url || "http://global.ymtracking.com/trace?offer_id=116686&aff_id=1&aff_sub=unlock%40%4056f33980e4b0f048710723e4&android_id=375dec1f7a6c588e";
    var ua = req.query.ua || "";
    var proxy_server = "http://" + req.query.proxy_ip + ":" + req.query.proxy_port;
    var childArgs;
    if (req.query.proxy_ip && req.query.proxy_port) {
        childArgs = [
            '--proxy=' + proxy_server,
            path.join(__dirname, 'phantomjs-script.js'),
            url,
            ua
        ]
    } else {
        childArgs = [
            path.join(__dirname, 'phantomjs-script.js'),
            url,
            ua,
            '--ignore-ssl-errors=true',
            '--ssl-protocol=tlsv1',
            '--local-to-remote-url-access=true'

        ]
    }
    var headers = {
        'User-Agent': ua || util.getUA()
    };
    childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
        console.log(stdout)
        var url = stdout.substring(0, stdout.indexOf("&redirects_time"));
        var redirects_time = parseInt(stdout.substring(stdout.indexOf("&redirects_time") + 16))

        var request_option = {
            url: url,
            headers: headers
        }

        if (req.query.proxy_ip && req.query.proxy_port) {
            request_option.agentClass = require('socks5-http-client/lib/Agent');
            request_option.agentOptions = {
                socksHost: req.query.proxy_ip, // Defaults to 'localhost'.
                socksPort: req.query.proxy_port // Defaults to 1080.
            }


        }
        util.requestHandler(request_option, res, redirects_time)


    })
})

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: __dirname })
});


app.use(function(req, res, next) {
    res.status(404).send("Sorry, page not found");
});
