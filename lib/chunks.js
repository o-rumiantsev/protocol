'use strict';

const CHUNK_SIZE = 2;
const CHUNK_TYPE = 1;
const STREAM_ID = 4;
const PACKET_ID = 4;
const PAYLOAD_LENGTH = 2;
const CHUNK_MAX_SIZE = 65536;

const chunkTypes = {
  PING: 0,
  PONG: 1,
  MESSAGE_PREAMBLE: 2,
  STREAM_PREAMBLE: 3,
  DATA_CHUNK: 4,
  STREAM_REQUEST: 5,
  STREAM_OK: 6
};

const dataChunk = (chunk) => {
  const payloadLength = chunk.payload.length;
  const size = CHUNK_SIZE + CHUNK_TYPE + PAYLOAD_LENGTH + payloadLength;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.DATA_CHUNK, 2);
  buf.writeUInt16LE(payloadLength, 3);
  buf.write(chunk.payload, 5);

  return buf;
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

const streamRequest = (streams) => {
  const streamId = streams.size + 1;
  const size = CHUNK_SIZE + CHUNK_TYPE + STREAM_ID;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.STREAM_REQUEST, 2);
  buf.writeUInt32LE(streamId, 3);

  return { streamId, buf };
};

const streamOk = (chunk) => {
  const streamId = chunk.streamId;
  const size = CHUNK_SIZE + CHUNK_TYPE + STREAM_ID;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.STREAM_OK, 2);
  buf.writeUInt32LE(streamId, 3);

  return buf;
};

module.exports = {
  dataChunk,
  streamPreamble,
  streamRequest,
  streamOk,
  chunkTypes,
  CHUNK_MAX_SIZE
};
