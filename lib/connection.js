'use strict';

const util = require('util');
const net = require('net');

const { EventEmitter } = require('events');

const processChunk = require('./processChunk.js');

function Connection(socket) {
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
    const data = processChunk(chunk);
    this.emit(data.type, data);
  });
}

util.inherits(Connection, EventEmitter);

module.exports = Connection;
