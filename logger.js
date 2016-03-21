var winston = require('winston');
winston.emitErrs = true;
var fs = require('fs')
var logDirectory = __dirname + '/logs'

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
fs.writeFileSync(logDirectory + '/error.log', '', 'utf8');
fs.writeFileSync(logDirectory + '/access.log', '', 'utf8');

var logger = new(winston.Logger)({
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
        })
    ],
    exitOnError: false
});
module.exports = logger;
module.exports.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};