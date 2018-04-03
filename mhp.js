
'use strict';

const Connection = require('./lib/connection.js');
const Server = require('./lib/server.js');
const Application = require('./lib/application.js');

const mhp = {
  Server,
  Application
};

mhp.connect = (appName, client, port, host, callback) => {
  const connection = new Connection(null, [client]);
  connection.connect(appName, client, port, host, callback);
};

module.exports = mhp;
