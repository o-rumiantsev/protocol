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
    const packetId = chunk.readUInt32LE(5);
    const buffer = chunk.slice(9, chunk.length);
    return { type, streamId, packetId, buffer };
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

processChunk.raw = (conn, chunk) => {
  if (chunk.length < conn.bytesToRead) {
    conn.bytesToRead -= chunk.length;
    conn.rawData = Buffer.concat([conn.rawData, chunk]);
  } else {
    const newChunk = chunk.slice(0, conn.bytesToRead);
    conn.rawData = Buffer.concat([conn.rawData, newChunk]);
    conn.emit('rawData', conn.rawData);

    chunk = chunk.slice(conn.bytesToRead);
    conn.rawData = Buffer.alloc(0);
    conn.bytesToRead = 0;

    if (chunk.length > 0) {
      conn.bytesToRead = chunk.readUInt16LE() - 2;
      chunk = chunk.slice(2);
      processChunk.raw(conn, chunk);
    }
  }
};


module.exports = processChunk;
