'use strict';

const util = require('util');

const { EventEmitter } = require('events');

const Transport = require('./transport.js');

function Client() {
  this.transport = new Transport();
}

util.inherits(Client, EventEmitter);


Client.prototype.connect = function(options, callback) {
  this.transport.connect(options, callback);
};

Client.prototype.sendData = function(chunk, callback) {
  this.transport.sendData(chunk, callback);
};

Client.prototype.createStream = function(stream, callback) {
  this.transport.createStream(stream, callback);
};

Client.prototype.end = function(data) {
  this.transport.end(data);
};

module.exports = Client;
