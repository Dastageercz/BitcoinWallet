let express = require("express");
let bip39 = require("bip39");
let sha256 = require("sha256");
var bs58check = require("bs58check");
let axios = require("axios");
let bitcore = require("bitcore-lib");
let HDKey = require("hdkey");
var bitcoinTransaction = require("bitcoin-transaction");
const { validate, getAddressInfo } = require("bitcoin-address-validation");
let bitcoin = require("bitcoinjs-lib");
const {
  isDecodedCreateTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

let BIP32Factory = require("bip32").default;

var pubKey, privKey, address, APIbalance;
const router = express.Router();

/*-------------------------------------------------Logic---------------------------------------------*/

const mnemonic = bip39.generateMnemonic();
//console.log("mnemonic:", mnemonic);

const seed = bip39.mnemonicToSeedSync(mnemonic).toString("hex");
//console.log("seed:", seed);

var hdkey = HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
const RootPrivateKey = hdkey.privateExtendedKey.toString("hex");
const RootPublicKey = hdkey.publicExtendedKey.toString("hex");
// console.log("RootPrivateKey:", RootPrivateKey);
// console.log("RootPublicKey:", RootPublicKey);

const keyDerive = hdkey.derive("m/0");
const DerivedPublicKey = keyDerive.publicExtendedKey;
const DerivedPrivateKey = keyDerive.privateExtendedKey;
//console.log("Derived Private Key: ", DerivedPrivateKey , "\nDerived Public Key: ", DerivedPublicKey);

import("tiny-secp256k1")
  .then((ecc) => BIP32Factory(ecc))
  .then((bip32) => {
    let node = bip32.fromBase58(RootPublicKey);
    let child = node.derivePath("m/0/0").__Q;
    let publicKey = child.toString("hex");
    pubKey = publicKey;
    //console.log("Public Key:" ,pubKey);

    const Address = bitcoin.payments.p2pkh({
      pubkey: Buffer.from(pubKey, "hex"),
    });
    address = Address.address;
    //console.log("Address:", address);
    // console.log(validate(address));
    //console.log(getAddressInfo("1FrhSYcxzs56quy157MPGF1va82UqynGEj"));
  });

import("tiny-secp256k1")
  .then((ecc) => BIP32Factory(ecc))
  .then((bip32) => {
    let node = bip32.fromBase58(RootPrivateKey);
    let child = node.derivePath("m/0/0").__D;
    let privateKey = child.toString("hex");
    privKey = privateKey;
  });

/**----------------------------------------------Transfer---------------------------------------------- */

const sendBitcoin = async (recieverAddress, amountToSend) => {
  const sochain_network = "BTCTEST";
  const privateKey = "KypZ6aJ3ARquAf1dbRvPiK1tqbt4GtJ4pp1pdcrybKu9mpiVLPiK";
  //const privateKey = privKey;
  const sourceAddress = "mufjUT3pF2KwNiC2UPBaFhyvLA4nUGd9P3";
  //const sourceAddress = address;
  const satoshiToSend = amountToSend * 100000000;
  let fee = 0;
  let inputCount = 0;
  let outputCount = 2;

  const utxos = await axios.get(
    `https://sochain.com/api/v2/get_tx_unspent/${sochain_network}/${sourceAddress}`
  );
  const transaction = new bitcore.Transaction();

  let totalAmountAvailable = 0;

  let inputs = [];
  utxos.data.data.txs.forEach(async (element) => {
    let utxo = {};
    utxo.satoshis = Math.floor(Number(element.value) * 100000000);
    utxo.script = element.script_hex;
    utxo.address = utxos.data.data.address;
    utxo.txId = element.txid;
    utxo.outputIndex = element.output_no;
    totalAmountAvailable += utxo.satoshis;
    inputCount += 1;
    inputs.push(utxo);
  });

  transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;

  fee = transactionSize * 2;
  if (totalAmountAvailable - satoshiToSend - fee < 0) {
    throw new Error("Balance is too low for this transaction");
  }

  transaction.from(inputs);
  transaction.to(recieverAddress, satoshiToSend);
  transaction.change(sourceAddress);
  transaction.fee(fee * 2);
  transaction.sign(privateKey);
  const serializedTransaction = transaction.serialize();

  const result = await axios({
    method: "POST",
    url: `https://sochain.com/api/v2/send_tx/${sochain_network}`,
    data: {
      tx_hex: serializedTransaction,
    },
  });

  router.get("/txdetails", (req, res) => {
    res.send(
      `https://www.blockchain.com/btc-testnet/tx/${result.data.data.txid}`
    );
  });
};

/**----------------------------------------------Routers------------------------------------------------*/

router.get("/details", (req, res) => {
  res.send({
    mnemonic: mnemonic,
    seed: seed,
    RootPrivateKey: RootPrivateKey,
    RootPublicKey: RootPublicKey,
    DerivedPrivateKey: DerivedPrivateKey,
    DerivedPublicKey: DerivedPublicKey,
    publicKey: pubKey,
    privateKey: privKey,
  });
});

router.get("/generateaddress", (req, res) => {
  res.send(address);
});

router.get("/balancetx",async (req,res) => {
  await axios
    .get(`https://chain.so/api/v2/get_address_balance/BTCTEST/mufjUT3pF2KwNiC2UPBaFhyvLA4nUGd9P3`)
    .then((balance) => {
      res.send(balance.data.data);
    });
});

router.post("/sendtx", (req, res) => {
  let { receiverAddress, amountToSend } = req.body;
  sendBitcoin(receiverAddress, amountToSend);
});

module.exports = router;
