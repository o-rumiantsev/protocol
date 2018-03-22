'use strict';

const net = require('net');
const fs = require('fs');
const { EventEmitter } = require('events');

const Transport = require('./transport.js');
const chunks = require('./chunks.js');

class Client extends EventEmitter {
  constructor() {
    super();
    this.transport = new Transport();
  }

  connect(port, host, callback) {
    this.transport.connect(port, host, callback);
  }

  sendData(chunk, callback) {
    this.transport.sendData(chunk, callback);
  }

  openStream(stream, callback) {
    this.transport.openStream(stream, callback);
  }

  end(data) {
    this.transport.end(data);
  }
}


// Test

const c = new Client();

c.connect({
  host: 'localhost',
  port: 3000
});

const call = {
  method: 'power',
  args: [2, 64]
};

const data = JSON.stringify(call);
c.sendData(data);

const fs1 = fs.createReadStream('./client.js');
const fs2 = fs.createReadStream('./server.js');
const fs3 = fs.createReadStream('./stream.js');

c.openStream(fs1, () => {
  console.log('fs1 sent');
});
c.openStream(fs2, () => {
  console.log('fs2 sent');
});
c.openStream(fs3, () => {
  console.log('fs3 sent');
});
