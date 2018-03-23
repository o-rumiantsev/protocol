'use strict';

const util = require('util');
const net = require('net');
const fs = require('fs');
const { EventEmitter } = require('events');

const Transport = require('./transport.js');
const chunks = require('./chunks.js');

function Client() {
  this.transport = new Transport();
}

util.inherits(Client, EventEmitter);


Client.prototype.connect = function(port, host, callback) {
  this.transport.connect(port, host, callback);
}

Client.prototype.sendData = function(chunk, callback) {
  this.transport.sendData(chunk, callback);
}

Client.prototype.createStream = function(stream, callback) {
  this.transport.createStream(stream, callback);
}

Client.prototype.end = function(data) {
  this.transport.end(data);
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

c.createStream((err, stream) => {
  fs1.pipe(stream);
});

c.createStream((err, stream) => {
  fs2.pipe(stream);
});
