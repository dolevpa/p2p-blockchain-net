// const topology = require('fully-connected-topology')
import topology from "fully-connected-topology";
import Blockchain from "./blockchain.js";
import  { Transaction } from "./transaction.cjs";
import * as crypto from "crypto";
import EC from "elliptic";
import { MerkleTree } from "merkletreejs";
import sha256 from "crypto-js/sha256.js";
// const EC = require('elliptic').ec
const hash = crypto.createHash("sha256");

const tree = new MerkleTree([], sha256);
var Eliptic = EC.ec;
var ec = new Eliptic('secp256k1');
const keyPair = ec.genKeyPair();
// const getKeyPair = () => {
//   const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
//     namedCurve: "secp256k1",
//   });
//   return { privateKey, publicKey };
// };
const newCoin = new Blockchain();
console.log(newCoin.miningReward);
// const { publicKey, privateKey } = getKeyPair();

console.log("public : " + keyPair.getPublic("hex"));
console.log("private : " + keyPair.getPrivate("hex"));
// console.log("public : " + publicKey.export({ type: "spki", format: "der" }).toString("hex"));
// console.log("private : " + privateKey.export({ type: "pkcs8", format: "der" }).toString("hex"));

// ( publicKey, privateKey ) = getKeyPair();

// console.log("public : " + publicKey.export({ type: "spki", format: "der" }).toString("hex"));
// console.log("private : " + privateKey.export({ type: "pkcs8", format: "der" }).toString("hex"));

const pubK = keyPair.getPublic("hex");
const privK = keyPair.getPrivate("hex");
// const pk = publicKey.export({ type: "spki", format: "der" }).toString("base64");
const tx = new Transaction(pubK, "lior", 10);

tx.signTransaction(pubK, privK);
newCoin.minePendingTransaction(pubK);

newCoin.addTransaction(tx);
console.log(newCoin.getBalanceOfAddress(pubK));
newCoin.minePendingTransactions("2");
console.log(newCoin.getBalanceOfAddress(pubK));

tree.addLeaves(newCoin.chain.map((block) => block.hash));
console.log(tree.toString());

console.log(tree.getRoot().toString("hex"));
const proof = tree.getProof(newCoin.chain[2].hash);
console.log(newCoin.chain[2].hash);
console.log(
  "is valid:",
  tree.verify(proof, newCoin.chain[2].hash, tree.getRoot().toString("hex"))
);

const { stdin, exit, argv } = process;
const { log } = console;
const { me, peers } = extractPeersAndMyPort();
const sockets = {};

log("---------------------");
log("Welcome to p2p chat!");
log("me - ", me);
log("peers - ", peers);
log("connecting to peers...");

const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);

//connect to peers
topology(myIp, peerIps).on("connection", (socket, peerIp) => {
  const peerPort = extractPortFromIp(peerIp);
  log("connected to peer - ", peerPort);
  sockets[peerPort] = socket;

  stdin.on("data", (data) => {
    //on user input
    const message = data.toString().trim();
    if (message === "exit") {
      //on exit
      log("Bye bye");
      exit(0);
    }

    const receiverPeer = extractReceiverPeer(message);
    console.log(message);
    if (sockets[receiverPeer]) {
      //message to specific peer
      if (peerPort === receiverPeer) {
        //write only once
        sockets[receiverPeer].write(
          formatMessage(extractMessageToSpecificPeer(message))
        );
      }
    } else {
      //broadcast message to everyone
      socket.write(formatMessage(message));
    }
  });

  //print data when received
  socket.on("data", (data) => {
    log(data.toString("utf8"));
    if (data.includes("fromAddress")) {
      var tempTx = JSON.parse(data.toString());
      const tx2 = new Transaction(
        tempTx.fromAddress,
        tempTx.toAddress,
        tempTx.amount,
        tempTx.signature
      );
      log(tx2);
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

//'hello' -> 'myPort:hello'
function formatMessage(message) {
  return `${me}>${message}`;
}

//'127.0.0.1:4000' -> '4000'
function extractPortFromIp(peer) {
  return peer.toString().slice(peer.length - 4, peer.length);
}

//'4000>hello' -> '4000'
function extractReceiverPeer(message) {
  return message.slice(0, 4);
}

//'4000>hello' -> 'hello'
function extractMessageToSpecificPeer(message) {
  return message.slice(5, message.length);
}
