'use strict';

const util = require('util');

const { EventEmitter } = require('events');
const Transport = require('./transport.js');
const RemoteProxy = require('./remoteProxy.js');

const config = require('../config/connection.json');
const chunks = require('./chunks.js');
const stream = require('./stream.js');

function Connection(socket, apps) {
  this.streams = new Map();
  this.transport = new Transport(this, socket);
  this.apps = apps;
  this.config = config;
}

util.inherits(Connection, EventEmitter);



Connection.prototype.connect = function(
  appName,
  client,
  port,
  host,
  callback
) {
  this.transport.socket.connect(port, host, () => {
    const remoteProxy = new RemoteProxy(this, appName, client);

    const inspect = chunks.inspect(appName);
    this._send(inspect);

    const onInspectResponse = (data) => {
      if (data.name !== appName) return;
      this.removeListener('inspect', onInspectResponse);
      const app = remoteProxy.fromApi(data.api);
      callback(null, this, app);
    };

    this.on('inspect', onInspectResponse);
  });
};


Connection.prototype.createStream = function(callback) {
  const data = chunks.stream(this.config);

  if (data instanceof Error) {
    callback(data);
    return;
  }

  const onStreamConfirm = ({ streamId }) => {
    if (streamId === data.streamId) {
      this.removeListener('streamResponse', onStreamConfirm);
      const newStream = stream.newDuplex(this, streamId);
      this.streams.set(streamId, newStream);
      callback(null, newStream);
    }
  };

  this._send(data.buf);
  this.on('streamResponse', onStreamConfirm);
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
