const fs = require('fs');

var logsDir = __dirname + '/logs/';
var logsPath = logsDir + 'sniper-bot-' + new Date().toISOString().slice(0,10) + '.txt';
const projectData = {
    utils: {
        createLog: function(content) {
            if (fs.existsSync(logsPath)) {
                content = '\r\n' + new Date().toLocaleTimeString() + ': ' + content;
                console.log(content);
            }
            fs.appendFile(logsPath, content, function (err) {
                if (err) throw err;
            });
        },
        propertyExists: function(object, key) {
            return object ? hasOwnProperty.call(object, key) : false;
        }
    }
};
module.exports = {
    projectData,
}
