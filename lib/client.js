'use strict';

const util = require('util');

const { EventEmitter } = require('events');

const Connection = require('./connection.js');

function Client() {
  this.connection = new Connection();
}

util.inherits(Client, EventEmitter);


Client.prototype.connect = function(options, callback) {
  this.connection.connect(options, callback);
};

Client.prototype.createStream = function(callback) {
  this.connection.createStream(callback);
};

Client.prototype.end = function(data) {
  this.connection.end(data);
};

module.exports = Client;
