'use strict';

const chunks = require('./chunks.js');
const stream = require('./stream.js');


const streamPreamble = (connection, chunk) => {
  const streamId = chunk.readUInt32LE(1);
  const packetId = chunk.readUInt32LE(5);
  const buffer = chunk.slice(9, chunk.length);

  const readable = connection.streams.get(streamId);
  readable.orderUnshift({ packetId, buffer });
};


const streamRequest = (connection, chunk) => {
  const streamId = chunk.readUInt32LE(1);

  const newStream = stream.newReadable();
  connection.streams.set(streamId, newStream);

  const streamAccept = chunks.streamAccept(streamId);
  connection._send(streamAccept);
  connection.emit('incomingStream', newStream);
};


const streamAccept = (connection, chunk) => {
  const streamId = chunk.readUInt32LE(1);
  connection.emit('STREAM_ACCEPT', { streamId });
};

module.exports = {
  streamPreamble,
  streamRequest,
  streamAccept
};
