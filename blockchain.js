import Block from "./block.js";
import { Transaction } from "./transaction.cjs";

export default class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3;
    this.pendingTransactions = [];
    this.miningReward = 10;
  }

  /**
   * @returns {Block}
   */
  createGenesisBlock() {
    return new Block(Date.parse("2017-01-01"), [], "0");
  }

  /**
   * Returns the latest block on our chain. Useful when you want to create a
   * new Block and you need the hash of the previous Block.
   *
   * @returns {Block[]}
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a new transaction to the list of pending transactions (to be added
   * next time the mining process starts). This verifies that the given
   * transaction is properly signed.
   *
   * @param {Transaction} transaction
   */
  addTransaction(transaction) {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error("Transaction must include from and to address");
    }

    // Verify the transactiion
    if (!transaction.isValid(transaction.fromAddress)) {
      throw new Error("Cannot add invalid transaction to chain");
    }

    if (transaction.amount <= 0) {
      throw new Error("Transaction amount should be higher than 0");
    }

    // Making sure that the amount sent is not greater than existing balance
    if (
      this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount
    ) {
      throw new Error("Not enough balance");
    }

    this.pendingTransactions.push(transaction);
    console.log("transaction added to pending list!");
  }

  /**
   * Returns the balance of a given wallet address.
   *
   * @param {string} address
   * @returns {number} The balance of the wallet
   */
  getBalanceOfAddress(address) {
    let balance = 100;
    for (const block of this.chain) {
      for (const trans of block.transactions) {
        if (trans.fromAddress === address) {
          console.log(
            `balance is  ${balance}, amount is ${trans.amount} tip is ${
              trans.tip
            } burn is ${this.chain.indexOf(block)}`
          );
          balance -= Number(trans.amount) + trans.tip + this.chain.indexOf(block);
          console.log("new balance is after reduction", balance);
        }
        if (trans.toAddress === address) {
          balance += Number(trans.amount);
        }
      }
    }
    console.log("total balance is after ", balance);
    return balance;
  }

  /**
   * Returns a list of all transactions that happened
   * to and from the given wallet address.
   *
   * @param  {string} address
   * @return {Transaction[]}
   */
  getAllTransactionsForWallet(address) {
    const txs = [];

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress === address || tx.toAddress === address) {
          txs.push(tx);
        }
      }
    }

    console.log("get transactions for wallet count: %s", txs.length);
    return txs;
  }

  /**
   * Loops over all the blocks in the chain and verify if they are properly
   * linked together and nobody has tampered with the hashes. By checking
   * the blocks it also verifies the (signed) transactions inside of them.
   *
   * @returns {boolean}
   */
  isChainValid() {
    // Check if the Genesis block hasn't been tampered with by comparing
    // the output of createGenesisBlock with the first block on our chain
    const realGenesis = JSON.stringify(this.createGenesisBlock());

    if (realGenesis !== JSON.stringify(this.chain[0])) {
      return false;
    }

    // Check the remaining blocks on the chain to see if there hashes and
    // signatures are correct
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (previousBlock.hash !== currentBlock.previousHash) {
        return false;
      }

      if (!currentBlock.hasValidTransactions()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
    }

    return true;
  }

  sumAllTips(transactions) {
    var sum = 0;
    for (const tran of transactions) sum += tran.tip;
    return sum;
  }

  minePendingTransaction(miningRewardAddress) {
    const totalTips = this.sumAllTips(this.pendingTransactions);
    console.log("TOTAL TIPS ARE:    ", totalTips);
    const rewardTx = new Transaction(
      null,
      miningRewardAddress,
      this.miningReward + totalTips,undefined, undefined, 0
    );
    this.pendingTransactions.push(rewardTx);
    let block = new Block(
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);
    console.log("block succefully mined");
    this.chain.push(block);
    this.pendingTransactions = [];
  }

  isTransactionExist(hash) {
    for (const block of this.chain) {
      const proof = block.tree.getProof(hash);
      let verified = block.tree.verify(proof, hash, block.tree.getHexRoot());
      if (verified) return true;
    }
    return false;
  }

  getTotalMinedCoins() {
    var sum = 0;
    for (const block of this.chain) {
      for (const trans of block.transactions){
        console.log(`amount is : ${Number(trans.amount)} , tip is : ${trans.tip}`)
        sum += Number(trans.amount);
      }
    }
    // console.log("Total coins mined in the network's blocks: ", sum);
    return sum;
  }
  getCoinsInNetwork() {
    var sum = 0;
    var users = new Set();
    for (const block of this.chain) {
      for (const trans of block.transactions){
        users.add(trans.fromAddress)
        users.add(trans.toAddress)
      }
      sum += this.miningReward
      // sum -= this.chain.indexOf(block)*3
    }
    sum -= this.miningReward // remove 1 reward for genesis block
    sum -= this.getTotalBurnedCoins()
    users.delete(null)
    // console.log("size is ", users.size)
    // console.log("user : ", users)
    sum += users.size * 100 //users amount * starting balance for each user
    
    // console.log("Total coins in the network is: ", sum);
    return sum;
  }

  getTotalBurnedCoins() {
    var sum = 0;
    for (const block of this.chain) {
      sum += this.chain.indexOf(block)*3 
    }
    // console.log("Total coins burned in the network: ", sum);
    return sum;
  }
}
