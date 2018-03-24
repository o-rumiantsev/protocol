'use strict';

const util = require('util');
const net = require('net');

const { Readable, Duplex } = require('stream');
const { EventEmitter } = require('events');
const Connection = require('./connection.js');

const chunks = require('./chunks.js');
const processChunk = require('./processChunk.js');

const newReadable = () => {
  const stream = new Readable();
  stream._read = () => {};
  return stream;
}

const newDuplex = () => {
  const stream = new Duplex();
  stream._read = () => {};
  stream.write = (chunk, cb) => {
    const buf = Buffer.from(chunk);
    stream.push(chunk);
    if (cb) cb();
  }

  return stream;
}

function Transport(socket) {
  this.streams = new Map();
  this.connection = new Connection(socket);

  this.connection.on('STREAM_REQUEST', (data) => {
    const currentStream = newReadable();
    this.streams.set(data.streamId, currentStream);

    const streamOk = chunks.streamOk(data);
    this._send(streamOk);
    this.emit('incomingStream', currentStream);
  });

  this.connection.on('STREAM_PREAMBLE', (data) => {
    const readable = this.streams.get(data.streamId);
    readable.unshift(data.buffer);
  });
}

util.inherits(Transport, EventEmitter);


Transport.prototype.connect = function(port, host, callback) {
  this.connection.socket.connect(port, host, callback);
}


Transport.prototype.sendData = function(chunk, callback) {
  const data = chunks.dataChunk({
    payload: chunk
  })

  this._send(data, callback);
}


Transport.prototype.createStream = function(callback) {
  const onStreamData = (streamId, callback) => (chunk) => {
    const streamData = chunks.streamPreamble(streamId, chunk);
    this._send(streamData);
  }

  const data = chunks.streamRequest(this.streams);
  this.streams.set(data.streamId, null);

  const onStreamOk = ({ streamId }) => {
    if (streamId === data.streamId) {
      this.connection.removeListener('STREAM_OK', onStreamOk);
      const stream = newDuplex();
      this.streams.set(streamId, stream);
      stream.on('data', onStreamData(streamId));
      callback(null, stream);
    }
  }

  this._send(data.buf);
  this.connection.on('STREAM_OK', onStreamOk);
}


Transport.prototype._send = function(chunk, callback) {
  this.connection.socket.write(chunk, callback);
}


Transport.prototype.getStreamById = function(streamId) {
  return this.streams.get(streamId);
}


Transport.prototype.end = function(data) {
  let buf;
  if (data) buf = Buffer.from(data);
  this.connection.socket.end(buf);
}


module.exports = Transport;
