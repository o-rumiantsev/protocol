'use strict';

function RemoteProxy(connection, api) {
  this._connection = connection;

  for (const appInterface in api) {
    const methods = api[appInterface];
    this[appInterface] = newProxy(connection, appInterface, methods);
  }
}

function newProxy(conn, appInterface, methods) {
  const proxyApi = {};
  methods.forEach((method) => {
    proxyApi[method] = (...args) => {
      const callback = args.pop();
      conn.callMethod(appInterface, method, args, callback);
    };
  });
  return proxyApi;
}

module.exports = RemoteProxy;
