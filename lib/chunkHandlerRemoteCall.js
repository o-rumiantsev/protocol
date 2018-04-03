'use strict';

const chunks = require('./chunks.js');


// Handlers for chunks, which are used in RPC
//   conn - connection object, which
//          has received chunk
//   chunk - binary data


const handleInspect = (conn, chunk) => {
  const appName = chunk.slice(1, chunk.length).toString();
  conn.app = conn.apps.find(app => app.name === appName);
  const api = Object.assign({}, conn.app.api);

  for (const appInterface in api) {
    api[appInterface] = Object.keys(api[appInterface]);
  }

  const app = JSON.stringify({ name: appName, api });
  const appBuf = chunks.inspectResponse(app);
  conn.transport.send(appBuf);
};


const handleInspectResponse = (conn, chunk) => {
  const data = chunk.slice(1, chunk.length).toString();
  const app = JSON.parse(data);
  conn.emit('inspectResponse', app);
};


const handleCall = (conn, chunk) => {
  const options = chunk.slice(1, chunk.length).toString();
  const call = JSON.parse(options);

  const { interfaceName, methodName, args, key } = call;

  const callback = (error, result) => {
    const res = JSON.stringify({ error, result, key });
    const resBuf = chunks.callback(res);
    conn.transport.send(resBuf);
  };

  call.args.push(callback);
  conn.app.api[interfaceName][methodName](...args);
};


const handleCallback = (conn, chunk) => {
  const data = chunk.slice(1, chunk.length).toString();
  const result = JSON.parse(data);
  conn.emit('callback', result);
};

module.exports = {
  handleInspect,
  handleInspectResponse,
  handleCall,
  handleCallback
};
