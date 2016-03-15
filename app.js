var gplay = require('google-play-scraper');
var express = require('express')
var app = express()

app.get('/getAppInfo', function(req, res) {
    if (!req.query || !req.query.id) return res.send({ msg: "app id can not empty" })

    gplay.app({ appId: req.query.id || 'com.dxco.pandavszombies', lang: req.query.lang || "en", country: req.query.country || "us"})
        .then(function(app) {
            res.send(app);

            console.log('Retrieved application: ' + app);
        })
        .catch(function(e) {
            console.log('There was an error fetching the application!');
        });
})

app.use(function(req, res, next) {
    res.status(404).send("Sorry, page not found");
});
app.listen(8888)
