'use strict';

const util = require('util');
const common = require('metarhia-common');

const { EventEmitter } = require('events');
const Transport = require('./transport.js');
const RemoteProxy = require('./remoteProxy.js');

const config = require('../config/connection.json');
const chunks = require('./chunks.js');
const stream = require('./stream.js');


// MHP Connection class - high-level abstraction,
// which handles interaction between remote applications
//   socket - net.Socket, used to transfer data
//            through the connection
//   apps - array of application objects, remote client
//          can connect to
//
function Connection(socket, apps) {
  // Map of streams, handled by connection
  //   key - streamId
  //   value - appropriate stream object
  //
  this.streams = new Map();

  this.transport = new Transport(this, socket);
  this.apps = apps;
  this.config = config;
}

util.inherits(Connection, EventEmitter);


// Connect to remote app
//   appName - name of the application to connect to
//   client - application object to connect from
//   port - remote port
//   host - remote host
//   callback - function, which receives `err`, 'conn', and 'app'
//              err - cerror, during connection establishment
//              conn - connection object
//              app - remote proxy which handles
//                    call of methods in application,
//                    connected to
//
Connection.prototype.connect = function(
  appName, client, port, host, callback
) {
  this.transport.socket.connect(port, host, () => {
    const inspect = chunks.inspect(appName);
    this.transport.send(inspect);

    const onInspectResponse = (data) => {
      if (data.name !== appName) return;
      this.removeListener('inspectResponse', onInspectResponse);
      const app = new RemoteProxy(this, data.api);
      callback(null, this, app);
    };

    this.on('inspectResponse', onInspectResponse);
  });
};


// Create writable stream through the conection object
// callback - function, which receives `err` and `stream`
//            err - error, during stream establishment
//            stream - duplex stream, which can be piped
//                     by any readable stream to send data
//                     through the connection
//
Connection.prototype.createStream = function(callback) {
  const data = chunks.stream(this.config);

  if (data instanceof Error) {
    callback(data);
    return;
  }

  const onStreamResponse = ({ streamId }) => {
    if (streamId === data.streamId) {
      this.removeListener('streamResponse', onStreamResponse);
      const newStream = stream.newDuplex(this, streamId);
      this.streams.set(streamId, newStream);
      callback(null, newStream);
    }
  };

  this.transport.send(data.buf);
  this.on('streamResponse', onStreamResponse);
};


// Call method in remote application interface
//   interfaceName - name of the interface in remote application
//   mathodName - name of the method to call
//   args - array of arguments, to call method with
//   callback - function, which receives `err` and `result`
//              err - error, returned from remote method
//              result - result, returned from remote method
//
Connection.prototype.callMethod = function(
  interfaceName, methodName, args, callback
) {
  const key = common.generateKey(8, common.DIGIT);

  if (typeof callback !== 'function') {
    throw new TypeError('callback argument must be a function');
  }

  const callOptions = JSON.stringify({ interfaceName, methodName, args, key });
  const call = chunks.call(callOptions);

  const onCallback = (data) => {
    if (data.key !== key) return;
    this.removeListener('callback', onCallback);
    callback(data.error, data.result);
  };

  this.transport.send(call);
  this.on('callback', onCallback);
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
