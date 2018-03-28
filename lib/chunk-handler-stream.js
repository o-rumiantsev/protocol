'use strict';

const chunks = require('./chunks.js');
const stream = require('./stream.js');


const handleStreamPreamble = (connection, chunk) => {
  const streamId = chunk.readUInt32LE(1);
  const packetId = chunk.readUInt32LE(5);
  const buffer = chunk.slice(9, chunk.length);

  const readable = connection.streams.get(streamId);
  readable.orderUnshift({ packetId, buffer });
};


const handleStreamRequest = (connection, chunk) => {
  const streamId = chunk.readUInt32LE(1);

  const newStream = stream.newReadable();
  connection.streams.set(streamId, newStream);

  const streamConfirm = chunks.streamConfirm(streamId);
  connection._send(streamConfirm);
  connection.emit('incomingStream', newStream);
};


const handleStreamConfirm = (connection, chunk) => {
  const streamId = chunk.readUInt32LE(1);
  connection.emit('STREAM_CONFIRM', { streamId });
};


module.exports = {
  handleStreamPreamble,
  handleStreamRequest,
  handleStreamConfirm
};
