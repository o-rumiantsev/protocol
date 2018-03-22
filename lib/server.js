'use strict';

const net = require('net');
const { EventEmitter } = require('events');

const Transport = require('./transport.js');

class Server extends EventEmitter {
  constructor(api) {
    super();
    this.server = new net.Server();
    this.connections = new Set();

    this.server.on('connection', (sock) => {
      const transport = new Transport(sock);
      this.emit('connection', transport);
      this.connections.add(transport);
    });
  }

  listen(port, host, listener) {
    this.server.listen(port, host, listener);
  }
}

// Test

const s = new Server();
s.listen(3000, 'localhost', () => {
  console.log('TCP srver bound');
});
