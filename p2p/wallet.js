const topology = require('fully-connected-topology')
const crypto = require('crypto')
const EC = require('elliptic').ec
// import topology from 'fully-connected-topology'
const { Transaction } = require('../transaction.cjs')

// import transactions from 'json!./transactions.json'
const transactions = require('../transactions.json')

const {
    stdin,
    exit,
    argv
} = process
const {
    log
} = console
const {
    me,
    name,
    peers
} = extractPeersAndMyPort()
const sockets = {}

log('---------------------')
log('Welcome to p2p chat!')
log('me - ', me)
log('peers - ', peers)
log('connecting to peers...')

const myIp = toLocalIp(me)
const peerIps = getPeerIps(peers)
let index = 0
const ec = new EC('secp256k1')


const keyPair = ec.genKeyPair()
//connect to peers
var t = topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    // var bobSocket = t.peer("127.0.0.1:4003")
    // var aliceSocket = t.peer("127.0.0.1:4002")
    var otherPublicKey;
    // bobSocket.on()
    socket.on('connection', () => {
        socket.write(keyPair.getPublic("hex"))
       
    })
    socket.on('data', data => {
        otherPublicKey = String.fromCharCode(null, data);
        log("\n\n OTHER PUBLIC KEY \n ",otherPublicKey)
        
    })
    log("\n\n otherpublickey \n\n ,", otherPublicKey)
    const peerPort = extractPortFromIp(peerIp)
    log('connected to peer - ', peerPort)

    const sendSingleTransaction = (socket) => {
        // log(transactions.transactions[index])

        
        //log(name + transactions.transactions[index].fromAddress)
        if (transactions.transactions[index].fromAddress === name) {
            log(transactions.transactions[index])
            const tx = new Transaction(keyPair.getPublic("hex"), otherPublicKey, transactions.transactions[index].amount)
            tx.signTransaction(keyPair.getPublic("hex"), keyPair.getPrivate("hex"))
            var buf =  Buffer.from(JSON.stringify(tx))
            console.log(tx);
            socket.write(buf)
        }

        // socket.write(transactions.transactions[index])
        if(otherPublicKey)
            index++
    }

    setInterval(() => sendSingleTransaction(socket), 4000);
    sockets[peerPort] = socket

    stdin.on('data', (data) => { //on user input
        const message = data.toString().trim()
        if (message === 'exit') { //on exit
            log('Bye bye')
            exit(0);
        }


        const receiverPeer = extractReceiverPeer(message)
        if (sockets[receiverPeer]) { //message to specific peer
            if (peerPort === receiverPeer) { //write only once
                sockets[receiverPeer].write(formatMessage(extractMessageToSpecificPeer(message)))

            }
        } else { //broadcast message to everyone
            socket.write(formatMessage(message))




        }
    })
    //print data when received
    socket.on('data', data => log(data.toString('utf8')))



})


//extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort() {
    return {
        name: argv[2],
        me: argv[3],
        peers: argv.slice(4, argv.length)
    }
}

//'4000' -> '127.0.0.1:4000'
function toLocalIp(port) {
    return `127.0.0.1:${port}`
}

//['4000', '4001'] -> ['127.0.0.1:4000', '127.0.0.1:4001']
function getPeerIps(peers) {
    return peers.map(peer => toLocalIp(peer))
}

//'hello' -> 'myPort:hello'
function formatMessage(message) {
    return `${me}>${message}`
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