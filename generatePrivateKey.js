// import * as bip39 from "@scure/bip39";
import bip39 from 'bip39'
//import pbkdf2 from 'crypto-pbkdf2-hmac';
//import sha256 from "sha256";
import HDKey from "hdkey";
// import { wordlist } from "@scure/bip39/wordlists/english.js";



const mnemonic = bip39.generateMnemonic()
console.log("Seed:", mnemonic);
// const mnemonicPhase = mnemonic.toString();

// const seedPhase = mnemonicPhase;
// const password = seedPhase;
// const salt = 'Dastageer@1811';
// const iterations = 2048;
// const keylength = 64;
// const result = await pbkdf2.sha512(password, salt , iterations, keylength);
const seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex')
console.log("seed:", seed);

var hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
console.log("Private:", hdkey.privateExtendedKey)
console.log("Public:", hdkey.publicExtendedKey)

