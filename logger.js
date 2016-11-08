var winston = require('winston');
winston.emitErrs = true;
var fs = require('fs')
var logDirectory = __dirname + '/logs'
    // ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
fs.writeFileSync(logDirectory + '/error.log', '', 'utf8');
fs.writeFileSync(logDirectory + '/access.log', '', 'utf8');
fs.writeFileSync(logDirectory + '/debug.log', '', 'utf8');
var logger;
var env = process.env.env
console.log(process.env.env)
if (env === "dev") {
    console.log("now in dev env, have fun!")
    logger = {
        info: function(msg) {
            console.log(msg)
        },
        debug: function(msg) {
            console.info(msg)
        },
        error: function(msg) {
            console.error(msg)
        }

    }
} else {
    logger = new(winston.Logger)({
        transports: [

            new(winston.transports.File)({
                name: 'error-file',
                filename: logDirectory + '/error.log',
                level: 'error',
                handleExceptions: true,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 5,
                colorize: false
            }),
            new(winston.transports.File)({
                name: 'info-file',
                filename: logDirectory + '/access.log',
                level: 'info',
                handleExceptions: true,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 5,
                colorize: false
            }),
            new(winston.transports.File)({
                name: 'debug-file',
                filename: logDirectory + '/debug.log',
                level: 'debug',
                handleExceptions: true,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 5,
                colorize: false
            })
        ],
        exitOnError: false
    });
}

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};
