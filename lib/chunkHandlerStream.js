'use strict';

const chunks = require('./chunks.js');
const stream = require('./stream.js');


// Handlers for chunks, which are used in streaming
//   conn - connection object, which
//          has received chunk
//   chunk - binary data


const handleStreamChunk = (conn, chunk) => {
  const streamId = chunk.readUInt32LE(1);
  const packetId = chunk.readUInt32LE(5);
  const buffer = chunk.slice(9, chunk.length);

  const readable = conn.streams.get(streamId);
  readable.orderUnshift({ packetId, buffer });
};


const handleStream = (conn, chunk) => {
  const streamId = chunk.readUInt32LE(1);

  const newStream = stream.newReadable();
  conn.streams.set(streamId, newStream);

  const streamResponse = chunks.streamResponse(streamId);
  conn.transport.send(streamResponse);
  conn.emit('incomingStream', newStream);
};


const handleStreamResponse = (conn, chunk) => {
  const streamId = chunk.readUInt32LE(1);
  conn.emit('streamResponse', { streamId });
};


module.exports = {
  handleStreamChunk,
  handleStream,
  handleStreamResponse
};
