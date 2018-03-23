'use strict';

const util = require('util');
const net = require('net');
const { EventEmitter } = require('events');

const Transport = require('./transport.js');

function Server(api) {
  this.server = new net.Server();
  this.connections = new Set();

  this.server.on('connection', (sock) => {
    const transport = new Transport(sock);
    this.emit('connection', transport);
    this.connections.add(transport);
  });
}

util.inherits(Server, EventEmitter);

Server.prototype.listen = function(...params) {
  this.server.listen(...params);
}

// Test

const s = new Server();
s.listen(3000, 'localhost', () => {
  console.log('TCP srver bound');
});

s.on('connection', (transport) => {
  transport.on('incomingStream', (stream) => {
    console.log('incoming stream');
    stream.on('data', (chunk) => {
      console.log('bytes recieved', chunk.length);
    })
  });
});
