# bsc-presale-bot
币安智能链预售抢购机器人,支持pinksale、dxsale

# 注意事项：
当前只支持HTTP节点订阅，不支持WSS
请手动修改代码，在预售开始开始时发送交易（目前pinksale不支持提前2秒发送交易，会回滚交易）
建议购买或自行搭建BSC私有节点提高速度

**若需要0区块确认交易，请自行修改代码，在预售时间提前2-2.5秒发送交易**

# 使用方法
重命名`.env.example`文件为`.env`文件，并按照要求添加相应参数

# .env配置
```
# 节点 默认BSC主网 测试网：https://data-seed-prebsc-1-s1.binance.org:8545
node=https://bsc-dataseed.binance.org/
# 预售地址(复制PinkSale或DxSale的预售地址，注意不是Token合约地址)
presaleContractAddress=0xA926e7C0F6afA20569f7425bB3E93017C813****
# 购买bnb数量
buyingBnbAmount=2

# 助记词和私钥二选一，助记词优先级高于私钥，若助记词为空，则读取私钥。私钥支持多个钱包，使用英文逗号隔开，助记词暂时不支持多个钱包
# 助记词
mnemonic="civil planet ......"
# 私钥(支持多个私钥，使用英文逗号隔开)
senderPrivateKey=

# 热度高的项目建议使用200-2000
gasPrice=25
# 机器人延时启动
hours=0
mins=0
secs=0
```

# 运行
1.安装依赖
`npm i --save`

2.填写.env文件

3.`node sniper-bot.js`


# 运行日志示例
```
1小时0分钟0秒后启动机器人 (3600秒)
等待中......
====================================================
预售地址: 0x52E6d71D05CCc2061FabB3F060a6fCCA********
钱包地址: 0x975D64ef890E3e6DB1Dc9434A1C19e3c********
钱包余额：17.205405487549468 BNB
购买数量: 3 BNB
Gas limit: 500000
Gas price: 100 Gwei
预计矿工费: 小于0.05 BNB (Gas used x Gas price)
====================================================

11:00:00 PM: Presale contract is not active yet, method web3.eth.estimateGas() failed. Error message: Returned error: execution reverted: It is not time to buy
11:00:01 PM: Transaction estimation successful: 216559
11:00:01 PM: first and only transaction sent success. Transaction hash: 0x****. https://www.bscscan.com/tx/0x****.
11:00:05 PM: Transaction confirmed.
```
