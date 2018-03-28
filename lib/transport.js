'use strict';

const util = require('util');

const { EventEmitter } = require('events');
const Connection = require('./connection.js');

const chunks = require('./chunks.js');
const stream = require('./stream.js');

function Transport(socket) {
  this.streams = new Map();
  this.connection = new Connection(socket);

  this.connection.on('STREAM_REQUEST', (data) => {
    const newStream = stream.newReadable();
    this.streams.set(data.streamId, newStream);

    const streamOk = chunks.streamOk(data);
    this._send(streamOk);
    this.emit('incomingStream', newStream);
  });

  this.connection.on('STREAM_PREAMBLE', (data) => {
    const readable = this.streams.get(data.streamId);
    readable.orderUnshift(data);
  });
}

util.inherits(Transport, EventEmitter);



Transport.prototype.connect = function(options, callback) {
  this.connection.socket.connect(options, callback);
};



Transport.prototype.sendData = function(chunk, callback) {
  const data = chunks.dataChunk({
    payload: chunk
  });

  this._send(data, callback);
};


Transport.prototype.createStream = function(callback) {
  let packetId = 1;

  const onStreamData = (streamId) => (chunk) => {
    const streamData = chunks.streamPreamble(streamId, packetId, chunk);
    this._send(streamData);
    ++packetId;
  };

  const data = chunks.streamRequest(this.streams);
  this.streams.set(data.streamId, null);

  const onStreamOk = ({ streamId }) => {
    if (streamId === data.streamId) {
      this.connection.removeListener('STREAM_OK', onStreamOk);
      const newStream = stream.newDuplex();
      this.streams.set(streamId, newStream);
      newStream.on('data', onStreamData(streamId));
      callback(null, newStream);
    }
  };

  this._send(data.buf);
  this.connection.on('STREAM_OK', onStreamOk);
};


Transport.prototype._send = function(chunk, callback) {
  this.connection.socket.write(chunk, callback);
};


Transport.prototype.getStreamById = function(streamId) {
  return this.streams.get(streamId);
};


Transport.prototype.end = function(data) {
  let buf;
  if (data) buf = Buffer.from(data);
  this.connection.socket.end(buf);
};


module.exports = Transport;
