'use strict';

const chunks = require('./chunks.js');

const process = [
  (chunk) => {
    const type = 'PING';
    return 'ERR_NOT_IMPLEMENTED';
  },

  (chunk) => {
    const type = 'PONG';
    return 'ERR_NOT_IMPLEMENTED';
  },

  (chunk) => {
    const type = 'MESSAGE_PREAMBLE';
    return 'ERR_NOT_IMPLEMENTED';
  },

  (chunk) => {
    const type = 'STREAM_PREAMBLE';
    const streamId = chunk.readUInt32LE(1);
    const buffer = chunk.slice(5, chunk.length);
    return { type, streamId, buffer };
  },

  (chunk) => {
    const type = 'DATA_CHUNK';
    const length = chunk.readUInt16LE(1);
    const payload = chunk.slice(3, chunk.length).toString();
    return { type, length, payload };
  },

  (chunk) => {
    const type = 'STREAM_REQUEST';
    const streamId = chunk.readUInt32LE(1);
    return { type, streamId };
  },

  (chunk) => {
    const type = 'STREAM_OK';
    const streamId = chunk.readUInt32LE(1);
    return { type, streamId };
  }
];

const processChunk = (chunk) => {
  const type = chunk.readUInt8();
  return process[type](chunk);
};

processChunk.raw = (transport, chunk) => {
  if (chunk.length < transport.bytesToRead) {
    transport.bytesToRead -= chunk.length;
    rawData = Buffer.concat([rawData, chunk]);
  } else {
    const newChunk = chunk.slice(0, transport.bytesToRead);
    rawData = Buffer.concat([rawData, newChunk]);
    transport.emit('data', rawData);

    chunk = chunk.slice(transport.bytesToRead);
    rawData = Buffer.alloc(0);
    transport.bytesToRead = 0;

    if (chunk.length > 0) {
      transport.bytesToRead = chunk.readUInt16LE() - 2;
      chunk = chunk.slice(2);
      processDataChunk(chunk);
    }
  }
}


module.exports = processChunk;
