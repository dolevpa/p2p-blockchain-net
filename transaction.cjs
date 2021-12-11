// import * as crypto from 'crypto'

const crypto = require('crypto')
// const {
//     generateKeyPairSync,
//     createSign,
//     createVerify
//   } = await import('crypto');
  
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
      return crypto.createHash('sha256').update(this.fromAddress + this.toAddress + this.amount + this.timestamp).digest('hex');
    }
    signTransaction(publicKey, privateKey) {
      // You can only send a transaction from the wallet that is linked to your
      // key. So here we check if the fromAddress matches your publicKey
      // if (publicKey !== this.fromAddress) {
      //   throw new Error('You cannot sign transactions for other wallets!');
      // }
  
  
      // Calculate the hash of this transaction, sign it with the key
      // and store it inside the transaction obect
      const sign = crypto.createSign('SHA256');
      const hashTx = this.calculateHash();
      sign.update(hashTx);
      sign.end()
      const sig = sign.sign(privateKey, 'hex')

      this.signature = sig;

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
      var key = new crypto.KeyObject().from(this.fromAddress)
      
      const verify = crypto.createVerify('SHA256');
      verify.update(this.calculateHash());
      verify.end();
      const isVerified = verify.verify(publicKey, this.signature,'hex');
    //   const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
      return isVerified
    }
  }
  module.exports.Transaction = Transaction