'use strict';

const util = require('util');
const net = require('net');

const { EventEmitter } = require('events');

const processChunk = require('./processChunk.js');

function Transport(connection, socket) {
  this.connection = connection;
  this.socket = socket || new net.Socket();
  this.bytesToRead = 0;
  this.rawData = Buffer.alloc(0);

  this.socket.on('data', (chunk) => {
    if (this.bytesToRead === 0) {
      this.bytesToRead = chunk.readUInt16LE() - 2;
      chunk = chunk.slice(2);
    }

    processChunk.raw(this, chunk);
  });

  this.on('rawData', (chunk) => {
    processChunk(this.connection, chunk);
  });
}

util.inherits(Transport, EventEmitter);


// Send binary data
//   chunk - buffer object
//   callback - function, which will be
//              called, when all data sent
//
Transport.prototype.send = function(chunk, callback) {
  this.socket.write(chunk, callback);
};

module.exports = Transport;
