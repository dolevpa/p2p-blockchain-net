// import * as crypto from 'crypto'
const EC = require('elliptic').ec
const crypto = require('crypto')
const sha256 = require("crypto-js/sha256.js")
// const {
//     generateKeyPairSync,
//     createSign,
//     createVerify
//   } = await import('crypto');
  const ec = new EC('secp256k1');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'sect239k1'
  });
  
 class Transaction {
    /**
     * @param {string} fromAddress
     * @param {string} toAddress
     * @param {number} amount
     */
    constructor(fromAddress, toAddress, amount, signature ) {
      this.fromAddress = fromAddress;
      this.toAddress = toAddress;
      this.amount = amount;
      this.signature = signature;
      this.timestamp = Date.now(); 

    }
  
    /**
     * Creates a SHA256 hash of the transaction
     *
     * @returns {string}
     */
    calculateHash() {
      return sha256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString();
    }
    signTransaction(key) {
      // You can only send a transaction from the wallet that is linked to your
      // key. So here we check if the fromAddress matches your publicKey
      if (key.getPublic("hex") !== this.fromAddress) {
        throw new Error('You cannot sign transactions for other wallets!');
      }
  
      // const key = ec.keyFromPrivate(privateKey);
      // Calculate the hash of this transaction, sign it with the key
      // and store it inside the transaction obect
      // const sign = crypto.createSign('SHA256');
      
      const hashTx = this.calculateHash();
      const sign = key.sign(hashTx).toDER("hex");
      // sign.update(hashTx);
      // sign.end()
      // const sig = sign.sign(privateKey, 'hex')

      this.signature = sign;

    }
  
    /**
     * Checks if the signature is valid (transaction has not been tampered with).
     * It uses the fromAddress as the public key.
     *
     * @returns {boolean}
     */
    isValid(publicKey) {
      // If the transaction doesn't have a from address we assume it's a
      // mining reward and that it's valid. You could verify this in a
      // different way (special field for instance)

      // var prefix = '-----BEGIN PUBLIC KEY-----\n';
      // var postfix = '-----END PUBLIC KEY-----\n';
      // var pemText = prefix + Buffer.from(publicKey).toString('base64')+'\n' + postfix;
      // console.log(pemText);
      if (this.fromAddress === null) return true;
  
      if (!this.signature || this.signature.length === 0) {
        throw new Error('No signature in this transaction');
      }
      // var key = new crypto.KeyObject().from(this.fromAddress)
      console.log("public key before keyFromPublic: %s", publicKey)
      var key = ec.keyFromPublic(publicKey, 'hex');
      // const key = ec.keyFromPrivate(privateKey, 'hex');
      var isVerified = key.verify(this.calculateHash(), this.signature)
      // const verify = crypto.createVerify('SHA256');
      // verify.update(this.calculateHash());
      // verify.end();
      // var publicKeyFromAddress = crypto.createPublicKey(this.fromAddress, "pem",);
      // const isVerified = verify.verify(publicKeyFromAddress, this.signature,'base64');
    //   const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
      return isVerified
    }
  }
  module.exports.Transaction = Transaction