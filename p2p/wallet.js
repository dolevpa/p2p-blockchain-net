const topology = require("fully-connected-topology");
const crypto = require("crypto");
const EC = require("elliptic").ec;
// import topology from 'fully-connected-topology'
const { Transaction } = require("../transaction.cjs");

// import transactions from 'json!./transactions.json'
const transactions = require("../transactions.json");

const { stdin, exit, argv } = process;
const { log } = console;
const { me, name, peers } = extractPeersAndMyPort();
const sockets = {};

pkMap = new Map();
prMap = new Map();
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
// const publicKeys = new Map([['alice','048b5ffde8a59f2260c73e84507f7358f27a92f754487963ae37dbf41ce35c6bed531b3f752e64c6149df7c799981a78fb795c0b1a31d5c69defe9c72034f1f40c'], ['bob','044887569c7dde1fdb5f623421c75d7a4d7185044f60c34ac96e0ec6e6d0184c5c3a89047d39ace3e9e12b676b3e21c1f4f8ef73407b59a8b4290c73194889f932', '048b2a688a20eaf67abcb05f2f7156fc7f0762389755892906575418f33867894f356431fbf31ab560d18015c4e72241de66daebd8c3344d0e508ef2c22f02a7ef']])
// const privateKeys = ['cdd2aa423184d427c0a1623c6301ea131e285738dddca32583b1201d518e55ed', '84967ca4e61d9fc85840b802e287b0cca5a50529dac615b53aab1a80e2e98389', '7c3a039db97cb6ac7fc5966012fe2814103ec3c027003f2ad995a21777a16aeb']
log("---------------------");
log("Welcome to p2p chat!");
log("me - ", me);
log("peers - ", peers);
log("connecting to peers...");

const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);
let index = 0;
const ec = new EC("secp256k1");

var otherPublicKey;
let stageZero = false;
// const keyPair = ec.genKeyPair();
//connect to peers
var first = true;
var t = topology(myIp, peerIps).on("connection", (socket, peerIp) => {
  const peerPort = extractPortFromIp(peerIp);
  log("connected to peer - ", peerPort);

  const sendSingleTransaction = (socket) => {
    // log(transactions.transactions[index])

    //log(name + transactions.transactions[index].fromAddress)
    if (transactions.transactions[index].fromAddress === name) {
      log(transactions.transactions[index]);
      log(pkMap.get(name));
      let key = ec.keyFromPrivate(prMap.get(name), "hex");
      const tx = new Transaction(
        pkMap.get(name),
        pkMap.get(name === "alice" ? "bob" : "alice"),
        transactions.transactions[index].amount,
        undefined,
        undefined,
        transactions.transactions[index].tip ? 1 : 0
      );
      log("TX   ", tx);
      log("SEE MEEEEE", tx.fromAddress);
      log("SEE MEEEE2", key.getPublic("hex"));
      tx.signTransaction(key);
      var buf = Buffer.from(JSON.stringify(tx));
      console.log(tx);
      socket.write(buf);
    }

    index++;
  };

  if ((name === "bob") & first) {
    setTimeout(
      () => setInterval(() => sendSingleTransaction(socket), 2000),
      4000
    );
    first = false;
  } else setInterval(() => sendSingleTransaction(socket), 2000);
  sockets[peerPort] = socket;

  // stdin.on('data', (data) => { //on user input
  //     const message = data.toString().trim()
  //     if (message === 'exit') { //on exit
  //         log('Bye bye')
  //         exit(0);
  //     }

  // const receiverPeer = extractReceiverPeer(message)
  // if (sockets[receiverPeer]) { //message to specific peer
  //     if (peerPort === receiverPeer) { //write only once
  //         sockets[receiverPeer].write(formatMessage(extractMessageToSpecificPeer(message)))

  //     }
  // } else { //broadcast message to everyone
  //     socket.write(formatMessage(message))

  // }
  // })
  //print data when received
  // socket.on('data', data => log(data.toString('utf8')))
});

//extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort() {
  return {
    name: argv[2],
    me: argv[3],
    peers: argv.slice(4, argv.length),
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
