'use strict';

// MHP RemoteProxy class is used to make it
// similar to call local and remote procedures from
// another side of connection
//   connection - mhp connection object
//   api - schema of remote application api
//         which looks like
//         { interface: [methods], ... }
//
function RemoteProxy(connection, api) {
  this._connection = connection;

  for (const interfaceName in api) {
    const methods = api[interfaceName];
    this[interfaceName] = newInterface(connection, interfaceName, methods);
  }
}


// Factory of interfaces
//   conn - mhp connection object
//   interfaceName - name of the interface in remote
//                   application api
//   methods - array of names of methods in
//             appropriate interface
//
function newInterface(conn, interfaceName, methods) {
  const interfaceMethods = {};
  methods.forEach((methodName) => {
    interfaceMethods[methodName] = (...args) => {
      const callback = args.pop();
      conn.callMethod(interfaceName, methodName, args, callback);
    };
  });
  return interfaceMethods;
}

module.exports = RemoteProxy;
