var system = require('system');
var content = ""
var url = "http://global.ymtracking.com/trace?offer_id=116686&aff_id=1&aff_sub=unlock%40%4056f33980e4b0f048710723e4&android_id=375dec1f7a6c588e"
var final_url = ""
var redirects_time = 0
var redirect_url_arr = []
var ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.57 Safari/537.36';

function checkRedirects(myurl) {
    page = require('webpage').create();

    // suppress errors from output
    page.onError = function(msg, trace) {}

    // pretend to be a different browser, helps with some shitty browser-detection scripts
    page.settings.userAgent = ua;
    page.onResourceReceived = function(resource) {
        if (url == resource.url && resource.redirectURL) {
            redirectURL = resource.redirectURL;
        }
    };
    page.onNavigationRequested = function(url, type, willNavigate, main) {
        if (
            main &&
            url.match(/^http/ig) &&
            url != myurl &&
            url.replace(/\/$/, "") != myurl &&
            (type == "Other" || type == "Undefined") &&//  type = not by click/submit etc
            redirect_url_arr.indexOf(url) === -1
        ) {
            page.close();
            final_url = url;
            redirects_time = parseInt(redirects_time) + 1
            redirect_url_arr.push(url)
            checkRedirects(url); // reload on new page
        }
    };
    page.open(myurl, function(status) {
        //console.log("newurl: " + myurl)
        //console.log("page content :  " + page.content)
    });
}
// get url from cli
if (system.args.length === 1) {
    phantom.exit(1);
} else {
    url = system.args[1];
    ua = system.args[2] || ua;
    redirects_time = system.args[system.args.length - 1]  || redirects_time;
    redirects_time = parseInt(redirects_time)
}
final_url = url
    // run it!
checkRedirects(url)
setTimeout(function() {
    console.log(final_url + "&redirects_time=" + redirects_time + "&redirect_url_arr=" + redirect_url_arr.join("_url_"))
    phantom.exit();
}, 6000);
