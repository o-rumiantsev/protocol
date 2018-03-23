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

function Transport(socket) {
  this.onWritten = [];
  this.streams = new Map();
  this.socket = socket || new net.Socket();

  this.socket.on('data', (chunk) => {
    const data = processChunk(chunk);
    this.emit(data.type, data);
  });

  this.on('STREAM_REQUEST', (data) => {
    const currentStream = newReadable();
    this.streams.set(data.streamId, currentStream);
    const streamOk = chunks.streamOk(data);
    this._send(streamOk);
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


Transport.prototype.openStream = function(callback) {
  if (!(stream instanceof Readable || stream instanceof Duplex)) {
    callback(
      new Error('`stream` argument must be Readable or Duplex')
    );
    return
  }

  const onStreamData = (streamId) => (chunk) => {
    const streamData = chunks.streamPreamble(streamId, chunk);
    this._send(streamData);
  }

  const onStreamOk = ({ streamId }) => {
    if (streamId === data.streamId) {
      this.removeListener('STREAM_OK', onStreamOk);
      const stream = newReadable();
      this.streams.set(streamId, stream);
      stream.on('data', onStreamData(streamId));
      stream.on('end', () => {
        callback(null, stream);
      });
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
