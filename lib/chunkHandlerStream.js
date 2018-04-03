'use strict';

const chunks = require('./chunks.js');
const stream = require('./stream.js');


const handleStreamChunk = (connection, chunk) => {
  const streamId = chunk.readUInt32LE(1);
  const packetId = chunk.readUInt32LE(5);
  const buffer = chunk.slice(9, chunk.length);

  const readable = connection.streams.get(streamId);
  readable.orderUnshift({ packetId, buffer });
};


const handleStream = (connection, chunk) => {
  const streamId = chunk.readUInt32LE(1);

  const newStream = stream.newReadable();
  connection.streams.set(streamId, newStream);

  const streamResponse = chunks.streamResponse(streamId);
  connection._send(streamResponse);
  connection.emit('incomingStream', newStream);
};


const handleStreamResponse = (connection, chunk) => {
  const streamId = chunk.readUInt32LE(1);
  connection.emit('streamResponse', { streamId });
};


module.exports = {
  handleStreamChunk,
  handleStream,
  handleStreamResponse
};
