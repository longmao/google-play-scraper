var appList = function(CONFIG) {
    var fs = require('fs');
    var util = require('./util')()
    var that = this
    var exec = require('child_process').exec;
    var _ = require("./lodash.js")
    var gplay = require('google-play-scraper');
    var num = 10;
    var gplay_category = gplay.category;
    var gplay_category_length = _.size(gplay_category);
    var gplay_collection = gplay.collection;
    var Promise = require('bluebird');
    var app_categorys = [];
    var category_arr_val = _.values(gplay_category)
    var obj = {}
    var times = 0
    that.getAppListByCatogery = function(opts) {
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
            var _category = opts && opts.category || category_arr_val[0]
            that.getAppListByCatogery({
                category: _category,
                start: 0
            }).then(function(apps) {
                util.addAttsToArray(apps.app_categorys,{category:_category})
                apps.app_categorys = util.translateToBasicFormat(apps.app_categorys)
                obj[apps.category] = apps.app_categorys
                ++times;
                if (times === gplay_category_length) {
                    resolve(obj)
                } else {
                    console.log("times : " + times)
                    console.log(category_arr_val[times])
                    that.getAppList({
                        category: category_arr_val[times]
                    }).then(resolve)
                }

            })
        })

    }

    this.startCrawlCategoryList = function(opts) {

        return new Promise(function(resolve, reject) {

            var category = opts && opts.category || gplay_category.BOOKS_AND_REFERENCE
            var start = opts && opts.start || 0;
            gplay.list({
                    category: category,
                    collection: gplay_collection.GROSSING,
                    num: num,
                    start: start,
                    country: opts && opts.country,
                    lang: opts && opts.lang,
                    fullDetail: true
                })
                .then(function(apps) {
                    start = start + 10;
                    app_categorys = _.union(app_categorys, apps);

                    if (start < 50) {
                        opts.start = start;
                        that.startCrawlCategoryList(opts).then(resolve)
                    } else {
                        resolve({ app_categorys: app_categorys, category: category })
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
