const fs = require('fs');
const Cronr = require('cronr');
const Web3 = require('web3');
const dotenv = require("dotenv")
const bip39 = require("bip39")
const HdWallet = require("ethereum-hdwallet")
const projectData = require("./utils").projectData


dotenv.config()
var logsDir = __dirname + '/logs/';
// 创建日志输出路径
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// ======================== 读取配置 ========================
var node = 'https://bsc-dataseed.binance.org/';
var chainId = 56;
var gasLimit = process.env.gasLimit || 500000; // in gwei
var gasPrice = process.env.gasPrice || 10; // in gwei
gasPrice = gasPrice * 1000000000;
var cronTime = '*/100 * * * * * *'; // every 10 milliseconds 每10毫秒

var hours = process.env.hours || 0
var mins = process.env.mins || 0
var secs = process.env.secs || 5

var delaySecs = parseInt(hours) * 3600 + parseInt(mins) * 60 + parseInt(secs) // 延迟的秒数
var botInitialDelay = delaySecs * 1000; // 机器人延时启动毫秒

const presaleContractAddress = process.env.presaleContractAddress // 预售地址
const buyingBnbAmount = process.env.buyingBnbAmount // 购买的bnb数量
const mnemonic = process.env.mnemonic // 助记词
let senderPrivateKey = "" // 私钥

async function getPrivateKey(mnemonic) {
    // 助记词转私钥
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const hdwallet = HdWallet.fromSeed(seed)
    const key = hdwallet.derive("m/44'/60'/0'/0/0")
    return "0x" + key.getPrivateKey().toString("hex")
}

getPrivateKey(mnemonic).then(res => {
    senderPrivateKey = res
})
// ======================== 读取配置 ========================

var web3 = new Web3(new Web3.providers.HttpProvider(node));


async function initBot() {
    if (presaleContractAddress === '' || presaleContractAddress == null || presaleContractAddress.length !== 42 || await web3.eth.getCode(presaleContractAddress) === '0x') {
        return console.error('Missing or wrong presaleContractAddress parameter. presaleContractAddress must be contract address.');
    } else if (buyingBnbAmount === '' || buyingBnbAmount == null) {
        return console.error('Missing or wrong buyingBnbAmount parameter.');
    } else if (senderPrivateKey === '' || senderPrivateKey == null) {
        return console.error('Missing or wrong senderPrivateKey parameter.');
    }

    var privateKeys = [];
    if (senderPrivateKey.indexOf(',') > -1) {
        privateKeys = senderPrivateKey.split(',');
    } else {
        privateKeys.push(senderPrivateKey);
    }

    var addressesUsedToSendTransactions = ''; // 钱包地址
    var firstIteration = true;
    for (var i = 0, len = privateKeys.length; i < len; i+=1) {
        if (privateKeys[i].length !== 66) {
            return console.error('需要传入一个或多个钱包私钥，多个钱包私钥请使用,作为分隔符');
        }

        if (firstIteration) {
            firstIteration = false;
            addressesUsedToSendTransactions += web3.eth.accounts.privateKeyToAccount(privateKeys[i]).address;
        } else {
            addressesUsedToSendTransactions += ', ' + web3.eth.accounts.privateKeyToAccount(privateKeys[i]).address;
        }
    }

    var senderAddress = web3.eth.accounts.privateKeyToAccount(privateKeys[0]).address;
    web3.eth.getBalance(senderAddress).then(r => {
        const balance = r / 1000000000000000000
        console.log("====================================================")
        console.log(`预售地址: ${presaleContractAddress}`)
        console.log(`钱包地址: ${addressesUsedToSendTransactions}`);
        console.log(`钱包余额：${balance} BNB`)
        console.log(`购买数量: ${buyingBnbAmount} BNB`)
        console.log(`Gas limit: ${gasLimit}`);
        console.log(`Gas price: ${(gasPrice / 1000000000) + ' Gwei'}`);
        console.log(`预计矿工费: 小于${(gasLimit * (gasPrice / 1000000000)) / 1000000000} BNB`)
        console.log("====================================================")
        if (parseFloat(buyingBnbAmount) > balance) {
            console.error("钱包余额不足，已自动退出")
            process.exit()
        }
    })


    if (botInitialDelay > 0) {
        console.log(`${hours}小时${mins}分钟${secs}秒后启动机器人 (${botInitialDelay / 1000}秒)`)
        console.log("等待中......")
    } else {
        console.log('启动成功... ¯\\_(*o*)_/¯');
    }


    setTimeout(function () {
        var executeBuy = true;
        const job = new Cronr(cronTime, function() {
            // projectData.utils.createLog('Cronjob iteration.');
            if (executeBuy) {
                executeBuy = false;

                var counter = 0;
                return recursiveTransactionsLoop(counter);

                function recursiveTransactionsLoop(counter) {
                    var senderAddress = web3.eth.accounts.privateKeyToAccount(privateKeys[counter]).address;

                    web3.eth.estimateGas({to: presaleContractAddress, from: senderAddress, value: web3.utils.toHex(web3.utils.toWei(buyingBnbAmount, 'ether'))}, function(gasEstimateError, gasAmount) {
                        if (!gasEstimateError) {
                            projectData.utils.createLog('Transaction estimation successful: ' + gasAmount);

                            var txParams = {
                                gas: web3.utils.toHex(gasLimit),
                                gasPrice: web3.utils.toHex(gasPrice),
                                chainId: chainId,
                                value: web3.utils.toHex(web3.utils.toWei(buyingBnbAmount, 'ether')),
                                to: presaleContractAddress
                            };

                            web3.eth.accounts.signTransaction(txParams, privateKeys[counter], function (signTransactionErr, signedTx) {
                                if (!signTransactionErr) {
                                    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (sendSignedTransactionErr, transactionHash) {
                                        if (!sendSignedTransactionErr) {
                                            if (counter === privateKeys.length - 1) {
                                                if (privateKeys.length === 1) {
                                                    projectData.utils.createLog('Completed first and only transaction. Transaction hash: ' + transactionHash);
                                                } else {
                                                    projectData.utils.createLog('Completed last transaction. Transaction hash: ' + transactionHash);
                                                }
                                            } else {
                                                projectData.utils.createLog('Completed transaction. Transaction hash: ' + transactionHash);
                                                counter+=1;
                                                return recursiveTransactionsLoop(counter);
                                            }
                                        } else {
                                            executeBuy = true;
                                            if (sendSignedTransactionErr.message) {
                                                projectData.utils.createLog('Method web3.eth.sendSignedTransaction failed, most likely signed with low gas limit.. Message: ' + sendSignedTransactionErr.message);
                                            } else {
                                                projectData.utils.createLog('Method web3.eth.sendSignedTransaction failed, most likely signed with low gas limit.. Message: ' + sendSignedTransactionErr.toString());
                                            }

                                            if (counter !== privateKeys.length - 1) {
                                                counter+=1;
                                                return recursiveTransactionsLoop(counter);
                                            }
                                        }
                                    });
                                } else {
                                    executeBuy = true;
                                    if (signTransactionErr.message) {
                                        projectData.utils.createLog('Method web3.eth.accounts.signTransaction failed, most likely signed with low gas limit. Message: ' + signTransactionErr.message);
                                    } else {
                                        projectData.utils.createLog('Method web3.eth.accounts.signTransaction failed, most likely signed with low gas limit. Message: ' + signTransactionErr.toString());
                                    }

                                    if (counter !== privateKeys.length - 1) {
                                        counter+=1;
                                        return recursiveTransactionsLoop(counter);
                                    }
                                }
                            });
                        } else {
                            executeBuy = true;
                            if (gasEstimateError.message) {
                                projectData.utils.createLog('Presale contract is not active yet, method web3.eth.estimateGas() failed. Error message: ' + gasEstimateError.message);
                            } else {
                                projectData.utils.createLog('Presale contract is not active yet, method web3.eth.estimateGas() failed. Error message: ' + gasEstimateError.toString());
                            }

                            if (counter !== privateKeys.length - 1) {
                                counter+=1;
                                return recursiveTransactionsLoop(counter);
                            }
                        }
                    });
                }
            }
        }, {});
        job.start();
    }, botInitialDelay);
}
initBot();
