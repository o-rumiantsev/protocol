'use strict';

const CHUNK_SIZE = 2;
const CHUNK_TYPE = 1;
const STREAM_ID = 4;
const PACKET_ID = 4;

const chunkTypes = {
  STREAM_PREAMBLE: 0,
  STREAM_REQUEST: 1,
  STREAM_ACCEPT: 2
};

const streamPreamble = (streamId, packetId, chunk) => {
  const size = CHUNK_SIZE + CHUNK_TYPE + STREAM_ID + PACKET_ID;
  const buf = Buffer.alloc(size);

  const total = size + chunk.length;

  buf.writeUInt16LE(total);
  buf.writeUInt8(chunkTypes.STREAM_PREAMBLE, 2);
  buf.writeUInt32LE(streamId, 3);
  buf.writeUInt32LE(packetId, 7);

  return Buffer.concat([buf, chunk]);
};

const streamRequest = (config) => {
  const streamId = config.streamId++;

  if (config.maxStreams && config.maxStreams < streamId) {
    return new Error('max streams amount reached');
  }

  const size = CHUNK_SIZE + CHUNK_TYPE + STREAM_ID;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.STREAM_REQUEST, 2);
  buf.writeUInt32LE(streamId, 3);

  return { streamId, buf };
};

const streamConfirm = (streamId) => {
  const size = CHUNK_SIZE + CHUNK_TYPE + STREAM_ID;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.STREAM_ACCEPT, 2);
  buf.writeUInt32LE(streamId, 3);

  return buf;
};

module.exports = {
  streamPreamble,
  streamRequest,
  streamConfirm,
  chunkTypes
};
