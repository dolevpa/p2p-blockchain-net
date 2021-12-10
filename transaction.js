import * as crypto from 'crypto'
const {
    generateKeyPairSync,
    createSign,
    createVerify
  } = await import('crypto');
  
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'sect239k1'
  });
  
export default class Transaction {
    /**
     * @param {string} fromAddress
     * @param {string} toAddress
     * @param {number} amount
     */
    constructor(fromAddress, toAddress, amount) {
      this.fromAddress = fromAddress;
      this.toAddress = toAddress;
      this.amount = amount;
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
    //   if (signingKey.getPublic('hex') !== this.fromAddress) {
    //     throw new Error('You cannot sign transactions for other wallets!');
    //   }
  
  
      // Calculate the hash of this transaction, sign it with the key
      // and store it inside the transaction obect
      const sign = createSign('SHA256');
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
      if (this.fromAddress === null) return true;
  
      if (!this.signature || this.signature.length === 0) {
        throw new Error('No signature in this transaction');
      }
  
      const verify = crypto.createVerify('SHA256');
      verify.update(this.calculateHash());
      verify.end();
      const isVerified = verify.verify(publicKey, this.signature,'hex');
    //   const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
      return isVerified
    }
  }