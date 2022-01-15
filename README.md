# bsc-presale-bot
币安智能链预售抢购机器人,支持pinksale、dxsale

# 使用方法
重命名`.env.example`文件为`.env`文件，并按照要求添加相应参数

# .env配置
```
# 预售地址(注意不是Token合约地址)
presaleContractAddress=0xxxxxxx

# 节点(默认bsc主节点)
node=https://bsc-dataseed.binance.org/

# 购买bnb数量
buyingBnbAmount=0.1

# 钱包助记词(12个单词) 使用空格隔开
mnemonic="airport best ..."

# gas价格，建议设置7-100
gasPrice=25

# 根据时分秒设定倒计时延迟启动机器人(用于挂机自动抢购)
hours=0
mins=0
secs=5

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
预计矿工费: 小于0.05 BNB
====================================================

11:08:45 PM: Presale contract is not active yet, method web3.eth.estimateGas() failed. Error message: Returned error: execution reverted: It is not time to buy
```
