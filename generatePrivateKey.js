let express = require('express');
let bip39 = require('bip39');
let HDKey = require('hdkey');
const { validate, getAddressInfo } = require('bitcoin-address-validation')
let bitcoin = require('bitcoinjs-lib');

let BIP32Factory = require('bip32').default

var pubKey, privKey, address;
const router = express.Router();

/*-------------------------------------------------Logic---------------------------------------------*/

const mnemonic = bip39.generateMnemonic();
//console.log("mnemonic:", mnemonic);

const seed = bip39.mnemonicToSeedSync(mnemonic).toString("hex");
//console.log("seed:", seed);

var hdkey = HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
const RootPrivateKey = hdkey.privateExtendedKey.toString('hex');
const RootPublicKey = hdkey.publicExtendedKey.toString('hex');
// console.log("RootPrivateKey:", RootPrivateKey);
// console.log("RootPublicKey:", RootPublicKey);

const keyDerive =  hdkey.derive("m/0")
const DerivedPublicKey = keyDerive.publicExtendedKey
const DerivedPrivateKey = keyDerive.privateExtendedKey
//console.log("Derived Private Key: ", DerivedPrivateKey , "\nDerived Public Key: ", DerivedPublicKey);

import('tiny-secp256k1').then(ecc => BIP32Factory(ecc)).then(bip32 => {
    let node = bip32.fromBase58(RootPublicKey)
    let child = node.derivePath('m/0/0').__Q;
    let publicKey = child.toString('hex');
    pubKey = publicKey;
    //console.log("Public Key:" ,pubKey);

    const Address = bitcoin.payments.p2pkh({ pubkey: Buffer.from(pubKey, 'hex') });
    address = Address.address;
    //console.log("Address:", address);
    // console.log(validate(address));
    // console.log(getAddressInfo(address));
})

import('tiny-secp256k1').then(ecc => BIP32Factory(ecc)).then(bip32 => {
    let node = bip32.fromBase58(RootPrivateKey)
    let child = node.derivePath('m/0/0').__D;
    let privateKey = child.toString('hex');
    privKey = privateKey;
    //console.log("privateKey:",privateKey);
})

/**----------------------------------------------Routers------------------------------------------------*/

router.get("/details", (req,res) =>{
    res.send({
        mnemonic : mnemonic,
        seed: seed,
        RootPrivateKey: RootPrivateKey,
        RootPublicKey: RootPublicKey,
        DerivedPrivateKey: DerivedPrivateKey,
        DerivedPublicKey: DerivedPrivateKey,
        publicKey: pubKey,
        privateKey: privKey
    })
})

router.get("/generateaddress", (req,res) => {
    res.send(address)  
})

router.get("/balance",(req,res) => {
    res.send(`https://chain.so/api/v2/get_address_balance/BTCTEST/${address}`);
})
module.exports = router