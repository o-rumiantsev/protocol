'use strict';

const util = require('util');
const net = require('net');

const { Readable, Writable, Duplex } = require('stream');
const { EventEmitter } = require('events');

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
  this.onWritten = [];
  this.streams = new Map();
  this.socket = socket || new net.Socket();
  this.bytesToRead = 0;

  let rawData = Buffer.alloc(0);
  this.socket.on('data', (chunk) => {
    if (this.bytesToRead === 0) {
      this.bytesToRead = chunk.readUInt16LE() - 2;
      chunk = chunk.slice(2, chunk.length);
    }

    const read = rawData.length + chunk.length;

    if (this.bytesToRead > read) {
      rawData = Buffer.concat([rawData, chunk]);
      this.bytesToRead -= chunk.length;
    } else {
      const finish = chunk.slice(0, this.bytesToRead);
      rawData = Buffer.concat([rawData, finish]);

      const data = processChunk(rawData);
      console.log(data);
      this.emit(data.type, data);

      rawData = chunk.slice(this.bytesToRead);
      this.bytesToRead = rawData.length > 0 ?
        rawData.readUInt16LE() : 0;
    }
  });

  this.on('STREAM_REQUEST', (data) => {
    const currentStream = newReadable();
    this.streams.set(data.streamId, currentStream);
    const streamOk = chunks.streamOk(data);
    this._send(streamOk);
    this.emit('incommingStream', currentStream);
  });

  this.on('STREAM_PREAMBLE', (data) => {
    const readable = this.streams.get(data.streamId);
    readable.unshift(data.buffer);
  });
}

util.inherits(Transport, EventEmitter);


Transport.prototype.connect = function(port, host, callback) {
  this.socket.connect(port, host, callback);
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

  const onStreamOk = ({ streamId }) => {
    if (streamId === data.streamId) {
      this.removeListener('STREAM_OK', onStreamOk);
      const stream = newDuplex();
      this.streams.set(streamId, stream);
      stream.on('data', onStreamData(streamId));
      callback(null, stream);
    }
  }

  const data = chunks.streamRequest(this.streams);

  this._send(data.buf);
  this.on('STREAM_OK', onStreamOk);
}


Transport.prototype._send = function(chunk, callback) {
  if (this.writing) {
    this.onWritten.push(() => this._send(chunk, callback));
  } else {
    this.writing = true;
    this.socket.write(chunk, () => {
      this.writing = false;
      const listener = this.onWritten.shift();
      if (listener) listener();
      if (callback) callback();
    });
  }
}


Transport.prototype.getStreamById = function(streamId) {
  return this.streams.get(streamId);
}


Transport.prototype.end = function(data) {
  let buf;
  if (data) buf = Buffer.from(data);
  this.socket.end(buf);
}


module.exports = Transport;