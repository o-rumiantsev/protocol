'use strict';

const chunks = require('./chunks.js');


// Handler for chunk of type `INSPECT`
//
const handleInspect = (
  // connection - Connection object, which recieved the chunk
  connection,
  // chunk - Recieved chunk buffer
  chunk
) => {
  const appName = chunk.slice(1, chunk.length).toString();
  connection.app = connection.apps.find(app => app.name === appName);
  const api = Object.assign({}, connection.app.api);

  for (const appInterface in api) {
    api[appInterface] = Object.keys(api[appInterface]);
  }

  const app = JSON.stringify({ name: appName, api });
  const appBuf = chunks.inspectResponse(app);
  connection._send(appBuf);
};

const handleInspectResponse = (connection, chunk) => {
  const data = chunk.slice(1, chunk.length).toString();
  const app = JSON.parse(data);
  connection.emit('inspectResponse', app);
};

const handleCall = (connection, chunk) => {
  const options = chunk.slice(1, chunk.length).toString();
  const call = JSON.parse(options);

  const { interfaceName, methodName, args, key } = call;

  const callback = (error, result) => {
    const res = JSON.stringify({ error, result, key });
    const resBuf = chunks.callback(res);
    connection._send(resBuf);
  };

  call.args.push(callback);
  connection.app.api[interfaceName][methodName](...args);
};

const handleCallback = (connection, chunk) => {
  const data = chunk.slice(1, chunk.length).toString();
  const result = JSON.parse(data);
  connection.emit('callback', result);
};

module.exports = {
  handleInspect,
  handleInspectResponse,
  handleCall,
  handleCallback
};
