// import * as crypto from 'crypto'
const EC = require('elliptic').ec
const sha256 = require("crypto-js/sha256.js")
const ec = new EC('secp256k1')
  
  
 class Transaction {
    /**
     * @param {string} fromAddress
     * @param {string} toAddress
     * @param {number} amount
     */
    constructor(fromAddress, toAddress, amount, signature, timestamp, tip) {
      this.fromAddress = fromAddress;
      this.toAddress = toAddress;
      this.amount = amount;
      this.signature = signature;
      this.timestamp = timestamp?timestamp:Date.now();
      this.tip = tip;
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
      console.log("calculateHash before signing ", this.calculateHash())
      const hashTx = this.calculateHash();
      const sign = key.sign(hashTx).toDER("hex");
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

      if (this.fromAddress === null) return true;
  
      if (!this.signature || this.signature.length === 0) {
        throw new Error('No signature in this transaction');
      }
      console.log("public key before keyFromPublic: %s", publicKey)
      var key = ec.keyFromPublic(publicKey, 'hex');
      console.log("after key ", key.getPublic('hex'))
      console.log("calculateHash before verify ", this.calculateHash())
      var isVerified = key.verify(this.calculateHash(), this.signature)
      console.log("after isVerified ", isVerified)
      
      return isVerified
    }
  }
  module.exports.Transaction = Transaction