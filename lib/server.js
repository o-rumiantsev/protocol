'use strict';

const util = require('util');
const net = require('net');
const { EventEmitter } = require('events');

const Connection = require('./connection.js');

function Server(apps) {
  this.server = new net.Server();
  this.connections = new Set();

  this.server.on('connection', (sock) => {
    const connection = new Connection(sock, apps);
    this.emit('connection', connection);
    this.connections.add(connection);
  });
}

util.inherits(Server, EventEmitter);

Server.prototype.listen = function(...params) {
  this.server.listen(...params);
};

module.exports = Server;
