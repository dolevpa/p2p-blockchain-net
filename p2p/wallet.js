const topology = require("fully-connected-topology");
const crypto = require("crypto");
const EC = require("elliptic").ec;
const { Transaction } = require("../transaction.cjs");
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

log("---------------------");
log("Welcome to p2p chat!");
log("me - ", me);
log("peers - ", peers);
log("connecting to peers...");

const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);
let index = 0;
const ec = new EC("secp256k1");

//connect to peers
var first = true;
var t = topology(myIp, peerIps).on("connection", (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp);
    log("connected to peer - ", peerPort);
    var hashToCheck;
    const sendSingleTransaction = (socket) => {
        if (transactions.transactions[index] !== undefined) {
            if (transactions.transactions[index].fromAddress === name) {
                let key = ec.keyFromPrivate(prMap.get(name), "hex");
                const tx = new Transaction(
                    pkMap.get(name),
                    pkMap.get(name === "alice" ? "bob" : "alice"),
                    transactions.transactions[index].amount,
                    undefined,
                    undefined,
                    transactions.transactions[index].tip ? 1 : 0
                );
                tx.signTransaction(key);
                var buf = Buffer.from(JSON.stringify(tx));
                console.log(tx);
                hashToCheck = tx.calculateHash();
                socket.write(buf);
            }
            index++;
            
        } else {
            if (name === "bob") {
                setTimeout(() => socket.write(`check ${hashToCheck}`), 3000)
                setTimeout(() => socket.write("balance"), 6000)
            }
        }
    };

    sockets[peerPort] = socket;

    if ((name === "bob") && first) {
        setTimeout(() => setInterval(() => sendSingleTransaction(socket), 3000), 12200);
        first = false;
    } else
        setInterval(() => sendSingleTransaction(socket), 3000);

    socket.on('data', data => log(data.toString('utf8')))
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