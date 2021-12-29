import topology from "fully-connected-topology";
import Blockchain from "./blockchain.js";
import { Transaction } from "./transaction.cjs";
import * as crypto from "crypto";
import EC from "elliptic";
import { MerkleTree } from "merkletreejs";
import sha256 from "crypto-js/sha256.js";
const hash = crypto.createHash("sha256");

const tree = new MerkleTree([], sha256);
var Eliptic = EC.ec;
var ec = new Eliptic('secp256k1');
const keyPair = ec.genKeyPair();
const newCoin = new Blockchain();

console.log("public : " + keyPair.getPublic("hex"));
console.log("private : " + keyPair.getPrivate("hex"));

const pubK = keyPair.getPublic("hex");

const { stdin, exit, argv } = process;
const { log } = console;
const { me, peers } = extractPeersAndMyPort();
const sockets = {};

var pkMap = new Map();
var prMap = new Map();
pkMap.set(
  "alice",
  "048b5ffde8a59f2260c73e84507f7358f27a92f754487963ae37dbf41ce35c6bed531b3f752e64c6149df7c799981a78fb795c0b1a31d5c69defe9c72034f1f40c"
);
pkMap.set(
  "bob",
  "044887569c7dde1fdb5f623421c75d7a4d7185044f60c34ac96e0ec6e6d0184c5c3a89047d39ace3e9e12b676b3e21c1f4f8ef73407b59a8b4290c73194889f932"
);
prMap.set(
  "alice",
  "cdd2aa423184d427c0a1623c6301ea131e285738dddca32583b1201d518e55ed"
);
prMap.set(
  "bob",
  "84967ca4e61d9fc85840b802e287b0cca5a50529dac615b53aab1a80e2e98389"
);


log("---------------------");
log("Welcome to p2p chat!");
log("me - ", me);
log("peers - ", peers);
log("connecting to peers...");

const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);

//connect to peers
var t = topology(myIp, peerIps).on("connection", (socket, peerIp) => {
  const peerPort = extractPortFromIp(peerIp);
  log("connected to peer - ", peerPort);
  sockets[peerPort] = socket;

  socket.on("data", (data) => {

    if (data.includes("fromAddress")) {
      var tempTx = JSON.parse(data.toString());
      const newTransaction = new Transaction(
        tempTx.fromAddress,
        tempTx.toAddress,
        tempTx.amount,
        tempTx.signature,
        tempTx.timestamp,
        tempTx.tip
      );
      log(newTransaction);
      newCoin.addTransaction(newTransaction)
      if (newCoin.pendingTransactions.length === 3) {
        newCoin.minePendingTransaction(pubK);
      }
    }
    if (data.includes("balance") && newCoin.pendingTransactions.length === 0) {
      log("pending : ", newCoin.pendingTransactions)
      log("bob has ", newCoin.getBalanceOfAddress(pkMap.get('bob')))
      log("alice has ", newCoin.getBalanceOfAddress(pkMap.get('alice')))
      log("miner has ", newCoin.getBalanceOfAddress(pubK))
      log("Total mined coins: ", newCoin.getTotalMinedCoins())
      log("Total burned coins: ", newCoin.getTotalBurnedCoins())
      log("Total coins in network: ", newCoin.getCoinsInNetwork())
      exit(0)
    }
    if (data.includes("check")){ // check if data is check request.
      var hashToCheck = String(data).split(' ')
      var flag = newCoin.isTransactionExist(hashToCheck[1]) // validate transaction in block using merkle tree.
      socket.write(`isTransactionExist result with the hash: ${hashToCheck[1]} is ${flag}` ) // send back result.
    }
  });
});

//extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort() {
  return {
    me: argv[2],
    peers: argv.slice(3, argv.length),
  };
}

//'4000' -> '127.0.0.1:4000'
function toLocalIp(port) {
  return `127.0.0.1:${port}`;
}

//['4000', '4001'] -> ['127.0.0.1:4000', '127.0.0.1:4001']
function getPeerIps(peers) {
  return peers.map((peer) => toLocalIp(peer));
}
//'127.0.0.1:4000' -> '4000'
function extractPortFromIp(peer) {
  return peer.toString().slice(peer.length - 4, peer.length);
}