var util = function(CONFIG) {
    var fs = require('fs');
    var _index = 0;
    var request = require('request');
    var that = this
    this.cache_json_url = "google_play_apps.json"
    this.google_play_apps = "google_play_apps.txt"
    this.getData = function(srcPath, callback) {
        fs.readFile(srcPath, 'utf8', function(err, data) {
            if (err) throw err;
            callback && callback(data)
        });
    }
    this.writeData = function(savPath, saveData, logInfo, callback) {
        fs.writeFile(savPath, saveData, function(err) {
            if (err) throw err;
            console.log(logInfo);
            callback && callback()
        });
    }
    this.appendData = function(savPath, saveData, logInfo, callback) {
        fs.appendFile(savPath, saveData, function(err) {
            if (err) throw err;
            console.log(logInfo);
            callback && callback()
        });
    }

    this.getCurrentIndex = function() {
        return ++_index
    }
    this.resetCurrentIndex = function() {
        _index = 0
    }
    this.saveToJSONFile = function(app_id, url, app_num) {
        return (function(app_id, url, app_num) {
            console.log(url)
            request(url, function(error, response, body) {
                var newObj = {}
                var body_obj = JSON.parse(body)
                newObj[app_id] = body_obj
                var currentIndex = that.getCurrentIndex();
                var appendStr = ""
                if (currentIndex === 1) {
                    appendStr = "[" + JSON.stringify(newObj) + ","

                } else if (currentIndex === app_num) {
                    appendStr = JSON.stringify(newObj) + "]"
                    that.resetCurrentIndex()
                    console.log("congratuation!!! All Done!")

                } else {
                    appendStr = JSON.stringify(newObj) + ","
                }
                that.appendData(that.cache_json_url, appendStr, "finish save to cache : " + that.cache_json_url, function() {})
            })
        })(app_id, url, app_num)
    }

}




module.exports = function() {
    return new util();
}
