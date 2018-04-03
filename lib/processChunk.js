'use strict';

const streamChunkHandler = require('./chunkHandlerStream.js');
const remoteCallChunkHandler = require('./chunkHandlerRemoteCall.js');


// An array of chunk handlers. The value
// of chunk type in chunks.chunkTypes is
// the index of appropriate chunk handler
// in this array
//
const chunkHandlers = [
  streamChunkHandler.handleStreamChunk,
  streamChunkHandler.handleStream,
  streamChunkHandler.handleStreamResponse,
  remoteCallChunkHandler.handleInspect,
  remoteCallChunkHandler.handleInspectResponse,
  remoteCallChunkHandler.handleCall,
  remoteCallChunkHandler.handleCallback
];


// Process chunk of binary data, recieved
// by transport object
//   connection - mhp connection object
//   chunk - binary data
//
const processChunk = (connection, chunk) => {
  const type = chunk.readUInt8();
  const handler = chunkHandlers[type];

  if (typeof handler !== 'function') {
    connection.emit('error', new Error('ERR_INVALID_CHUNK_TYPE'));
    return;
  }

  handler(connection, chunk);
};


// Process raw data, which came directly to the net.Socket
// which is wrapped by transport object. TCP can slice data
// in any place so this function collects all slices of data
// with known lenght.
//  transport - mhp transport object
//  chunk - binary data, received by transport
//
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
