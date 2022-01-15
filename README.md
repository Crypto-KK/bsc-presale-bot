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
