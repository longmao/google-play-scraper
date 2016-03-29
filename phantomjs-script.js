var system = require('system');
var content = ""
var url = "http://global.ymtracking.com/trace?offer_id=116686&aff_id=1&aff_sub=unlock%40%4056f33980e4b0f048710723e4&android_id=375dec1f7a6c588e"
var final_url = "";

function checkRedirects(myurl) {
    page = require('webpage').create();

    // suppress errors from output
    page.onError = function(msg, trace) {}

    // pretend to be a different browser, helps with some shitty browser-detection scripts
    page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:22.0) Gecko/20100101 Firefox/22.0';

    page.onNavigationRequested = function(url, type, willNavigate, main) {
        if (
            main &&
            url != myurl &&
            url.replace(/\/$/, "") != myurl &&
            (type == "Other" || type == "Undefined") //  type = not by click/submit etc
        ) {
            page.close();
            final_url = url;
            checkRedirects(url); // reload on new page
        }
    };

    page.open(myurl, function(status) {
        //console.log("newurl: " + myurl)
    });
}
// get url from cli
if (system.args.length === 1) {
    phantom.exit(1);
} else {
    url = system.args[1];
}
final_url = url
// run it!
checkRedirects(url)
setTimeout(function() {
    console.log(final_url)
    phantom.exit();
}, 6000);
