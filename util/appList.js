var appList = function(CONFIG) {
    var fs = require('fs');
    var util = require('./util')()
    var that = this
    var exec = require('child_process').exec;
    var _ = require("./lodash.js")
    var gplay = require('google-play-scraper');
    var start = 0
    var num = 10;
    var gplay_category = gplay.category;
    var gplay_category_length = _.size(gplay_category);
    var gplay_collection = gplay.collection;
    var Promise = require('bluebird');
    var app_categorys = [];
    var obj = {}
    var times = 0
    that.getAppListByCatogery = function(opts) {

        return new Promise(function(resolve, reject) {
            app_categorys = []
            start = 0;
            that.startCrawlCategoryList(opts)
                .then(resolve)
                .catch(reject)
        })
    }

    this.getAppList = function() {
        return new Promise(function(resolve, reject) {

            _.map(gplay_category, function(k, v) {
                that.getAppListByCatogery({
                    category: v
                }).then(function(apps, category) {
                    obj[category] = apps
                    ++times;
                    if (times === gplay_category_length) {
                        resolve(obj)
                    }

                })
            })
        })

    }

    this.startCrawlCategoryList = function(opts) {

        return new Promise(function(resolve, reject) {

            var category = opts && opts.category || gplay_category.BOOKS_AND_REFERENCE
            gplay.list({
                    category: category,
                    collection: gplay_collection.TOP_FREE,
                    num: num,
                    start: start,
                    country: opts && opts.country,
                    lang: opts && opts.lang,
                    fullDetail: true
                })
                .then(function(apps) {

                    start = start + 10;
                    app_categorys = _.union(app_categorys, apps);

                    if (start < 10) {
                        that.startCrawlCategoryList(opts).then(resolve)
                    } else {
                        resolve(app_categorys, category)
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
