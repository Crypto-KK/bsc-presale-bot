// 助记词转私钥
const bip39 = require("bip39")
const HdWallet = require("ethereum-hdwallet")

const mnemonic = '填写助记词'
async function g() {
    const seed = await bip39.mnemonicToSeed(mnemonic)
    const hdwallet = HdWallet.fromSeed(seed)
    const key = hdwallet.derive("m/44'/60'/0'/0/0")
    console.log("私钥：0x" + key.getPrivateKey().toString("hex"))
}

g()
