const fs = require('fs');
const bip39 = require("bip39")
const HdWallet = require("ethereum-hdwallet")

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
        consoleLog: function (content) {
            content = '\r\n' + new Date().toLocaleTimeString() + ': ' + content;
            console.log(content);
        },
        propertyExists: function(object, key) {
            return object ? hasOwnProperty.call(object, key) : false;
        },
        async getPrivateKey(mnemonic) {
            // 助记词转私钥
            const seed = await bip39.mnemonicToSeed(mnemonic)
            const hdwallet = HdWallet.fromSeed(seed)
            const key = hdwallet.derive("m/44'/60'/0'/0/0")
            return "0x" + key.getPrivateKey().toString("hex")
        }
    }
};
module.exports = {
    projectData,
}
