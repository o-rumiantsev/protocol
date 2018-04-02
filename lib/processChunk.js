'use strict';

const streamChunkHandler = require('./chunk-handler-stream.js');
const remoteCallChunkHandler = require('./chunk-handler-remote-call.js');

const chunkHandlers = [
  streamChunkHandler.handleStreamChunk,
  streamChunkHandler.handleStream,
  streamChunkHandler.handleStreamResponse,
  remoteCallChunkHandler.handleInspect,
  remoteCallChunkHandler.handleInspectResponse,
  remoteCallChunkHandler.handleCall,
  remoteCallChunkHandler.handleCallback
];

const processChunk = (connection, chunk) => {
  const type = chunk.readUInt8();
  const handler = chunkHandlers[type];

  if (typeof handler !== 'function') {
    connection.emit('error', new Error('ERR_INVALID_CHUNK_TYPE'));
    return;
  }

  handler(connection, chunk);
};

processChunk.raw = (transport, chunk) => {
  if (chunk.length < transport.bytesToRead) {
    transport.bytesToRead -= chunk.length;
    transport.rawData = Buffer.concat([transport.rawData, chunk]);
  } else {
    const newChunk = chunk.slice(0, transport.bytesToRead);
    transport.rawData = Buffer.concat([transport.rawData, newChunk]);
    transport.emit('rawData', transport.rawData);

    chunk = chunk.slice(transport.bytesToRead);
    transport.rawData = Buffer.alloc(0);
    transport.bytesToRead = 0;

    if (chunk.length > 0) {
      transport.bytesToRead = chunk.readUInt16LE() - 2;
      chunk = chunk.slice(2);
      processChunk.raw(transport, chunk);
    }
  }
};


module.exports = processChunk;
