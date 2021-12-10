import  { PeerServer } from 'peer';

const peerServer = PeerServer({ port: 9000, path: '/' });

peerServer.on('connection',()=> console.log('some1 connected'))