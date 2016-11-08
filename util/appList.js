var appList = function(CONFIG) {
    var fs = require('fs');
    var util = require('./util')()
    var that = this
    var exec = require('child_process').exec;
    var _ = require("./lodash.js")
    var gplay = require('google-play-scraper');
    var NUM = 100;
    var gplay_category = gplay.category;
    var gplay_category_length = _.size(gplay_category);
    var gplay_collection = gplay.collection;
    var Promise = require('bluebird');
    var app_categorys = [];
    var category_arr_val = _.values(gplay_category)
    var collection_arr_val = ['topgrossing']
    var times = 0


    that.getAppListHandler = function(opts) {
        return new Promise(function(resolve, reject) {
            app_categorys = []
            that.startCrawlCategoryList(opts)
                .then(function(apps) {
                    resolve(apps)
                })
                .catch(reject)
        })
    }

    this.getAppList = function(opts) {
        return new Promise(function(resolve, reject) {
            console.log(opts)
            var _category = opts && opts.category || category_arr_val[0]
            var _collection = opts && opts.collection || collection_arr_val[0]
            var _opts = { start: 0 };
            if (opts && opts.collection) {
                _opts.collection = _collection;
            } else {
                _opts.category = _category;
            }
            console.log(_opts)
            that.getAppListHandler(_opts).then(function(apps) {
                util.addAttsToArray(apps.app_categorys, { category:apps.category, collection : apps.collection })
                apps.app_categorys = util.translateToBasicFormat(apps.app_categorys, {category:apps.category, collection : apps.collection})
                var obj = {}
                obj[apps.category || apps.collection] = apps.app_categorys
                    ++times;

                console.log("times : " + times)


                var appendStr = JSON.stringify(obj)
                if (times === 1) {
                    appendStr = "[" + appendStr + ","
                } else if (times === (gplay_category_length + collection_arr_val.length)) {
                    appendStr = "" + appendStr + "]"
                } else {
                    appendStr = "" + appendStr + ","
                }
                util.appendData("./file/top_category_500.json", appendStr, "save 500 app : " + (apps.category || apps.collection))

                if (times === (gplay_category_length + collection_arr_val.length)) {
                    resolve()
                } else {
                    if (times < gplay_category_length) {
                        that.getAppList({
                            category: category_arr_val[times]
                        }).then(resolve)
                    } else {
                        that.getAppList({
                            collection: collection_arr_val[gplay_category_length - times]
                        }).then(resolve)
                    }

                }

            })
        })

    }

    this.startCrawlCategoryList = function(opts) {

        return new Promise(function(resolve, reject) {

            var category = opts && opts.category || "";
            var collection = opts && opts.collection || gplay_collection.GROSSING
            var start = opts && opts.start || 0;
            gplay.list({
                    category: category,
                    collection: collection,
                    num: NUM,
                    start: start,
                    country: opts && opts.country,
                    lang: opts && opts.lang,
                    fullDetail: true
                })
                .then(function(apps) {
                    start = start + NUM;
                    app_categorys = _.union(app_categorys, apps);

                    if (start < NUM*5) {
                        opts.start = start;
                        that.startCrawlCategoryList(opts).then(resolve)
                    } else {
                        resolve({ app_categorys: app_categorys, category: category, collection: collection })
                    }

                })
                .catch(function(e) {
                    reject(e)
                    console.log('There was an error fetching the list!');
                });
        })

    }
}




module.exports = function() {
    return new appList();
}
