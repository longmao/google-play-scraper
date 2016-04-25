var util = function(CONFIG) {
    var fs = require('fs');
    var _index = 0;
    var request = require('request');
    var that = this
    var exec = require('child_process').exec;

    this.isFetchingData = false
    this.get_cache_json_url = function(path) {
        return path + "file/google_play_apps.json";
    }
    this.get_google_play_apps = function(path) {
        return path + "file/google_play_apps.txt";
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
            callback && callback()
        });
    }
    this.appendData = function(savPath, saveData, logInfo, callback) {
        fs.appendFile(savPath, saveData, function(err) {
            if (err) throw err;
            callback && callback()
        });
    }

    this.getCurrentIndex = function() {
        return ++_index
    }
    this.resetCurrentIndex = function() {
        _index = 0
    }

    this.saveToJSONFile = function(app_id, url, app_num, callback) {
        return (function(app_id, url, app_num) {
            console.log(url)
            request(url, function(error, response, body) {
                var newObj = {}
                var body_obj = JSON.parse(body)
                newObj[app_id] = body_obj
                var currentIndex = that.getCurrentIndex();
                var appendStr = ""
                console.log("save index : " + currentIndex)
                console.log("save id : " + app_id)
                if (currentIndex === 1) {
                    appendStr = "[" + JSON.stringify(newObj) + ","

                } else if (currentIndex === app_num) {
                    appendStr = JSON.stringify(newObj) + "]"
                    that.resetCurrentIndex()
                    console.log("congratuation!!! All Done!")
                    that.isFetchingData = false

                } else {
                    appendStr = JSON.stringify(newObj) + ","
                }
                that.appendData(that.get_cache_json_url("./"), appendStr, "finish save to cache : " + that.get_cache_json_url("./"), function() {
                    var message = currentIndex === app_num ? "finished" : "Index: " + currentIndex + ", Url: " + url + "---" + currentIndex + "---" + app_num;

                    callback && callback(message)
                    if (currentIndex == app_num) {
                        exec("cp  file/google_play_apps.json upload/", function() {
                            exec('svn commit -m "update json file" --username=vincent.yang --password=DCsAp666', { cwd: "upload/" }, function() {
                                console.log("awesome news!!the google_play_apps.json have been updated, please contact the dever to svn up")
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
