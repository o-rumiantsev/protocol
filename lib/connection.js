'use strict';

const util = require('util');

const { EventEmitter } = require('events');
const Transport = require('./transport.js');

const config = require('../config/connection.json');
const chunks = require('./chunks.js');
const stream = require('./stream.js');

function Connection(socket) {
  this.streams = new Map();
  this.transport = new Transport(this, socket);
  this.config = config;
}

util.inherits(Connection, EventEmitter);



Connection.prototype.connect = function(options, callback) {
  this.transport.socket.connect(options, callback);
};


Connection.prototype.createStream = function(callback) {
  const data = chunks.streamRequest(this.config);

  if (data instanceof Error) {
    callback(data);
    return;
  }

  const onStreamAccept = ({ streamId }) => {
    if (streamId === data.streamId) {
      this.removeListener('STREAM_ACCEPT', onStreamAccept);
      const newStream = stream.newDuplex(this, streamId);
      this.streams.set(streamId, newStream);
      callback(null, newStream);
    }
  };

  this._send(data.buf);
  this.on('STREAM_ACCEPT', onStreamAccept);
};


Connection.prototype._send = function(chunk, callback) {
  this.transport.socket.write(chunk, callback);
};


Connection.prototype.getStreamById = function(streamId) {
  return this.streams.get(streamId);
};


Connection.prototype.end = function(data) {
  let buf;
  if (data) buf = Buffer.from(data);
  this.transport.socket.end(buf);
};


module.exports = Connection;
