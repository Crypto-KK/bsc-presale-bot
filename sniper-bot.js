// const fs = require('fs');
const Cronr = require('cronr');
const Web3 = require('web3');
const dotenv = require("dotenv")
const chalk = require("chalk")

const projectData = require("./utils").projectData


dotenv.config()
// var logsDir = __dirname + '/logs/';
// // 创建日志输出路径
// if (!fs.existsSync(logsDir)) {
//     fs.mkdirSync(logsDir);
// }

// ======================== 读取配置 ========================
var node = process.env.node || 'https://bsc-dataseed.binance.org/';
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

const mnemonic = process.env.mnemonic || "" // 助记词
let senderPrivateKey = process.env.senderPrivateKey || "" // 私钥


if (mnemonic) {
    console.log(chalk.blue("检测到使用助记词方式导入钱包"))
    projectData.utils.getPrivateKey(mnemonic).then(res => {
        senderPrivateKey = res
    })
} else {
    console.log(chalk.blue("检测到使用私钥方式导入钱包"))
}

// ======================== 读取配置 ========================

var web3 = new Web3(new Web3.providers.HttpProvider(node));


async function initBot() {
    if (presaleContractAddress === '' || presaleContractAddress == null || presaleContractAddress.length !== 42 || await web3.eth.getCode(presaleContractAddress) === '0x') {
        return console.error('预售地址没填写或填写错误，预售地址必须是合约地址');
    } else if (buyingBnbAmount === '' || buyingBnbAmount == null) {
        return console.error('购买BNB的数量填写错误');
    } else if (senderPrivateKey === '' || senderPrivateKey == null) {
        return console.error('私钥填写错误');
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
        console.log(`预售地址:`, chalk.green(presaleContractAddress))
        console.log(`钱包地址:`, chalk.green(addressesUsedToSendTransactions));
        console.log(`钱包余额:`, chalk.green(`${balance} BNB`))
        console.log(`购买数量:`, chalk.green(`${buyingBnbAmount} BNB`))
        console.log(`Gas limit: ${gasLimit}`);
        console.log(`Gas price: ${(gasPrice / 1000000000) + ' Gwei'}`);
        console.log(`矿工费: < ${(gasLimit * (gasPrice / 1000000000)) / 1000000000} BNB (Gax used x Gas price)`)
        console.log("====================================================")
        if (parseFloat(buyingBnbAmount) > balance) {
            console.log(chalk.red("钱包余额不足，已自动退出"))
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
            // projectData.utils.consoleLog('Cronjob iteration.');
            if (executeBuy) {
                executeBuy = false;

                var counter = 0;
                return recursiveTransactionsLoop(counter);

                function recursiveTransactionsLoop(counter) {
                    var senderAddress = web3.eth.accounts.privateKeyToAccount(privateKeys[counter]).address;

                    web3.eth.estimateGas({to: presaleContractAddress, from: senderAddress, value: web3.utils.toHex(web3.utils.toWei(buyingBnbAmount, 'ether'))}, function(gasEstimateError, gasAmount) {
                        if (!gasEstimateError) {
                            projectData.utils.consoleLog('Transaction estimation successful: ' + gasAmount);

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
                                                    projectData.utils.consoleLog(`first and only transaction sent success. Transaction hash: ${transactionHash}. https://www.bscscan.com/tx/${transactionHash}`);
                                                } else {
                                                    projectData.utils.consoleLog(`Completed last transaction. Transaction hash: ${transactionHash}. https://www.bscscan.com/tx/${transactionHash}`);
                                                }
                                            } else {
                                                projectData.utils.consoleLog('Completed transaction. Transaction hash: ' + transactionHash);
                                                counter+=1;
                                                return recursiveTransactionsLoop(counter);
                                            }
                                        } else {
                                            executeBuy = true;
                                            if (sendSignedTransactionErr.message) {
                                                projectData.utils.consoleLog('sendSignedTransaction failed, most likely signed with low gas limit.. Message: ' + sendSignedTransactionErr.message);
                                            } else {
                                                projectData.utils.consoleLog('sendSignedTransaction failed, most likely signed with low gas limit.. Message: ' + sendSignedTransactionErr.toString());
                                            }

                                            if (counter !== privateKeys.length - 1) {
                                                counter+=1;
                                                return recursiveTransactionsLoop(counter);
                                            }
                                        }
                                    })
                                        .on("receipt", () => {
                                            console.log(chalk.green(`Transaction confirmed.`))
                                        })
                                        .on("error", (err) => {
                                            console.log("Error during transaction execution. Details will follow.")
                                            console.log(err)
                                        })
                                } else {
                                    executeBuy = true;
                                    if (signTransactionErr.message) {
                                        projectData.utils.consoleLog('signTransaction failed, most likely signed with low gas limit. Message: ' + signTransactionErr.message);
                                    } else {
                                        projectData.utils.consoleLog('signTransaction failed, most likely signed with low gas limit. Message: ' + signTransactionErr.toString());
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
                                projectData.utils.consoleLog('estimateGas failed. Error message: ' + gasEstimateError.message);
                            } else {
                                projectData.utils.consoleLog('estimateGas failed. Error message: ' + gasEstimateError.toString());
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
