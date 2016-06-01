var util = function(CONFIG) {
    var fs = require('fs');
    var _index = 0;
    var request = require('request');
    var that = this
    var exec = require('child_process').exec;
    var _ = require("./lodash.js")
    var childProcess = require('child_process')
    var phantomjs = require('phantomjs-prebuilt')
    var binPath = phantomjs.path
    var path = require('path')
    var logger = require("../logger");


    this.isFetchingData = false;
    this.getUA = function() {
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.57 Safari/537.36'
    }
    this.get_cache_json_url = function(path) {
        return path + "file/gp-category-bundle.json";
    }
    this.get_google_play_apps = function(path) {
        return path + "file/gp-category-bundle.txt";
    }
    this.addAttsToArray = function(arr, opts) {
        _.forEach(arr, function(app, index) {
            arr[index][ opts.category ? "app_category_rank" : "app_top_rank"] = index + 1;
            _.map(opts, function(v, k) {
                arr[index]["" + k] = v
            })
        })
    }

    this.getFinalSpiderHtml = function(req, res) {
        var url = req.query.url || "";
        var ua = req.query.ua || "";
        var proxy_server = "http://" + req.query.proxy_ip + ":" + req.query.proxy_port;
        var childArgs;
        if (req.query.proxy_ip && req.query.proxy_port) {
            childArgs = [
                path.join(__dirname, '../phantomjs-script.js'),
                url,
                ua,
                '--proxy=' + proxy_server,
                0
            ]
        } else {
            childArgs = [
                path.join(__dirname, '../phantomjs-script.js'),
                url,
                ua,
                0
            ]
        }

        that.execPhantomBin(res, req, childArgs, ua)
    }
    this.execPhantomBin = function(res, req, childArgs, ua) {
        logger.debug(childArgs)
        childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
            logger.debug(stdout)
            var url = stdout.substring(0, stdout.indexOf("&redirects_time"));

            var redirects_time = parseInt(stdout.substring(stdout.indexOf("&redirects_time") + 16))
            var redirects_urls = parseInt(stdout.substring(stdout.indexOf("&redirect_url_arr") + 18))
            logger.debug("redirects_time : " + redirects_time);
            var headers = {
                'User-Agent': ua || that.getUA()
            };
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
            that.requestHandler(request_option, res, req, redirects_time, childArgs, ua)


        })
    }
    this.requestHandler = function(request_option, res, req, redirects_time, childArgs, ua) {
        logger.debug(request_option)
        request_option.timeout = 30000;
        request.get(request_option,
            function(error, response, body) {
                logger.debug(error)
                if (error) {
                    logger.error("error : " + error.toString() + ",  request_option : " + JSON.stringify(request_option))
                    return res.send({
                        html: error.toString(),
                        headers: "",
                        finalUrl: "",
                        redirects_time: "",

                    });
                }

                response.headers['statusCode'] = response.statusCode;
                var matchedMeta = body.match(/<meta.*http-equiv="refresh".*content="(.*)".*>/)
                var matchedUrl = "";
                var matchReditectUrl = "";

                if (matchedMeta) {
                    if (matchedMeta.replace) {
                        matchedUrl = matchedMeta && matchedMeta[0] && matchedMeta[0].match(/url=(.+)"/i);
                    } else {
                        matchedMeta = matchedMeta.toString()
                        matchedMeta = matchedMeta.replace(/'/gi, '')
                        matchedUrl = matchedMeta.match(/url=(.+)"/i);

                    }

                    matchReditectUrl = matchedUrl && matchedUrl[1]

                    logger.debug("matchedMeta: " + matchedMeta)
                    logger.debug("matchedUrl: " + matchedUrl[1])
                    logger.debug("matchReditectUrl: " + matchReditectUrl)
                }


                if (matchReditectUrl) {
                    var _request_option = request_option;
                    _request_option.time = _request_option.time || redirects_time;
                    ++_request_option.time;
                    _request_option.url = matchReditectUrl
                    logger.debug("get refresh url times:" + _request_option.time)

                    childArgs[1] = matchReditectUrl;
                    childArgs[childArgs.length - 1] = _request_option.time

                    that.execPhantomBin(res, req, childArgs, ua)
                } else {
                    res.send({
                        html: body,
                        headers: response.headers,
                        finalUrl: request_option.url,
                        redirects_time: redirects_time,

                    });
                }

            })
    }
    this.getData = function(srcPath, callback) {
        fs.readFile(srcPath, 'utf8', function(err, data) {
            if (err) throw err;
            callback && callback(data)
        });
    }
    this.writeData = function(savPath, saveData, logInfo, callback) {
        fs.writeFile(savPath, saveData, function(err) {
            if (err) throw err;
            logInfo && logger.debug(logInfo)
            callback && callback()
        });
    }
    this.appendData = function(savPath, saveData, logInfo, callback) {
        fs.appendFile(savPath, saveData, function(err) {
            if (err) throw err;
            logInfo && logger.debug(logInfo)
            callback && callback()
        });
    }
    this.translateToBasicFormat = function(arr_app_category, opts) {
            var arr = []
            _.forEach(arr_app_category, function(app, index) {
                arr.push({
                    appId: app.appId,
                    url: app.url,
                    title: app.title,
                    comments: app.comments,
                    developer: app.developer,
                    language: "en",
                    supply_country: "us",
                    app_top_rank: app.app_top_rank || "NA",
                    app_category_rank: app.app_category_rank || "NA",
                    app_category_primary: app.category,
                    app_category_secondary: app.app_category_secondary,
                    app_description: app.description,
                    free: app.free,
                    iap: app.offersIAP,
                    price: app.price,
                    rating_average: app.score,
                    rating_current_version: app.score,
                    rating_counts_average: app.reviews,
                    content_rating: app.contentRating,
                    file_size_bytes: app.size,
                    created: app.updated,
                    updated: app.updated,
                    downloads: app.minInstalls + " - " + app.maxInstalls,
                    what_is_new: app.whatisnew,
                    permissions: app.permissions || "",
                    min_os_version: app.requiredAndroidVersion,
                    supported_devices: app.requiredAndroidVersion,
                    supported_languages: app.supported_languages,
                    screenshots: app.screenshots,
                    icons: app.icon,
                    videos: app.video

                })
            })
            return arr;

        },
        this.getCurrentIndex = function() {
            return ++_index
        }
    this.resetCurrentIndex = function() {
        _index = 0
    }

    this.is_from_browser = function(ua) {
        var is_from_browser = false;

        if (/mobile/i.test(ua))
            is_from_browser = true;

        if (/like Mac OS X/.test(ua)) {
            is_from_browser = true;
        }

        if (/Android/.test(ua))
            is_from_browser = true;

        if (/webOS\//.test(ua))
            is_from_browser = true;

        if (/(Intel|PPC) Mac OS X/.test(ua))
            is_from_browser = true;

        if (/Windows NT/.test(ua))
            is_from_browser = true;

        if (/mobile/i.test(ua))
            is_from_browser = true;

        if (/like Mac OS X/.test(ua)) {
            is_from_browser = true;
        }

        if (/Android/.test(ua))
            is_from_browser = true;

        if (/webOS\//.test(ua))
            is_from_browser = true;

        if (/(Intel|PPC) Mac OS X/.test(ua))
            is_from_browser = true;

        if (/Windows NT/.test(ua))
            is_from_browser = true;
        return is_from_browser
    }
    this.startCrawl = function(callback) {
        var util = that
        if (util.isFetchingData) return
        util.isFetchingData = true
        util.writeData(util.get_cache_json_url("./"), "", "", function() {
            util.getData(util.get_google_play_apps("./"), function(data) {
                var arr = data.split("\n")
                var arr_app_id = []
                arr.forEach(function(i) {

                    var id = i.replace("\n", "");
                    id = id.replace("\r", "")
                    id && arr_app_id.push(id);
                })
                arr_app_id = _.uniq(arr_app_id)
                var arr_app_id_length = arr_app_id.length
                for (var j = 0; j < arr_app_id_length; j++) {
                    var url = "http://localhost:8888/getAppInfo?id=" + arr_app_id[j] + "&lang=en&country=us";
                    util.saveToJSONFile(arr_app_id[j], url, arr_app_id_length, callback)
                }
            })

        })
    }
    this.saveToJSONFile = function(app_id, url, app_num, callback) {
        return (function(app_id, url, app_num) {
            logger.debug(url)
            request(url, function(error, response, body) {
                var newObj = {}
                var body_obj = JSON.parse(body)
                newObj[app_id] = body_obj
                var currentIndex = that.getCurrentIndex();
                var appendStr = ""
                logger.debug("save index : " + currentIndex)
                logger.debug("save id : " + app_id)
                if (currentIndex === 1) {
                    appendStr = "[" + JSON.stringify(newObj) + ","

                } else if (currentIndex === app_num) {
                    appendStr = JSON.stringify(newObj) + "]"
                    that.resetCurrentIndex()
                    logger.debug("congratuation!!! All Done!")
                    that.isFetchingData = false

                } else {
                    appendStr = JSON.stringify(newObj) + ","
                }
                that.appendData(that.get_cache_json_url("./"), appendStr, "finish save to cache : " + that.get_cache_json_url("./"), function() {
                    var message = currentIndex === app_num ? "finished" : "Index: " + currentIndex + ", Url: " + url + "---" + currentIndex + "---" + app_num;

                    callback && callback(message)
                    if (currentIndex == app_num) {
                        exec("cp  file/*.json upload/", function() {
                            exec("svn add *.json", function() {
                                exec('svn commit -m "update json file" --username=vincent.yang --password=DCsAp666', { cwd: "upload/" }, function() {
                                    logger.debug("awesome news!!the google_play_apps.json have been updated, please contact the dever to svn up")
                                })
                            })
                        })
                    }
                })


            })
        })(app_id, url, app_num)
    }



}




module.exports = function() {
    return new util();
}
