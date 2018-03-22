'use strict';

const CHUNK_TYPE = 1;
const STREAM_ID = 4;
const CHUNK_LENGTH = 2;
const CHUNK_MAX_SIZE = 65536;

const chunkTypes = {
  PING: 0,
  PONG: 1,
  MESSAGE_PREAMBLE: 2,
  STREAM_PREAMBLE: 3,
  DATA_CHUNK: 4,
  STREAM_REQUEST: 5,
  STREAM_OK: 6
}

const dataChunk = (chunk) => {
  const payloadLength = chunk.payload.length;
  const size = CHUNK_TYPE + CHUNK_LENGTH + payloadLength;
  const buf = Buffer.alloc(size);

  buf.writeUInt8(chunkTypes.DATA_CHUNK);
  buf.writeUInt16LE(payloadLength, 1);
  buf.write(chunk.payload, 3);

  return buf;
};

const streamPreamble = (streamId, chunk) => {
  const size = CHUNK_TYPE + STREAM_ID;
  const buf = Buffer.alloc(size);

  const total = size + chunk.length;

  buf.writeUInt8(chunkTypes.STREAM_PREAMBLE);
  buf.writeUInt32LE(streamId, 1);

  return Buffer.concat([buf, chunk], total);
};

const streamRequest = (streams) => {
  const streamId = streams.size + 1;
  const size = CHUNK_TYPE + STREAM_ID;
  const buf = Buffer.alloc(size);

  buf.writeUInt8(chunkTypes.STREAM_REQUEST);
  buf.writeUInt32LE(streamId, 1);

  return { streamId, buf };
};

const streamOk = (chunk) => {
  const streamId = chunk.streamId;
  const size = CHUNK_TYPE + STREAM_ID;
  const buf = Buffer.alloc(size);

  buf.writeUInt8(chunkTypes.STREAM_OK);
  buf.writeUInt32LE(streamId, 1);

  return buf;
};

module.exports = {
  dataChunk,
  streamPreamble,
  streamRequest,
  streamOk,
  chunkTypes,
  CHUNK_MAX_SIZE
}
