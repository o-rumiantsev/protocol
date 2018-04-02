'use strict';

const CHUNK_SIZE = 2;
const CHUNK_TYPE = 1;
const STREAM_ID = 4;
const PACKET_ID = 4;

const chunkTypes = {
  STREAM_CHUNK: 0,
  STREAM: 1,
  STREAM_RESPONSE: 2,
  INSPECT: 3,
  INSPECT_RESPONSE: 4,
  CALL: 5,
  CALLBACK: 6
};

const streamChunk = (streamId, packetId, chunk) => {
  const size = CHUNK_SIZE + CHUNK_TYPE + STREAM_ID + PACKET_ID;
  const buf = Buffer.alloc(size);

  const total = size + chunk.length;

  buf.writeUInt16LE(total);
  buf.writeUInt8(chunkTypes.STREAM_CHUNK, 2);
  buf.writeUInt32LE(streamId, 3);
  buf.writeUInt32LE(packetId, 7);

  return Buffer.concat([buf, chunk]);
};

const stream = (config) => {
  const streamId = config.streamId++;

  if (config.maxStreams && config.maxStreams < streamId) {
    return new Error('max streams amount reached');
  }

  const size = CHUNK_SIZE + CHUNK_TYPE + STREAM_ID;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.STREAM, 2);
  buf.writeUInt32LE(streamId, 3);

  return { streamId, buf };
};

const streamResponse = (streamId) => {
  const size = CHUNK_SIZE + CHUNK_TYPE + STREAM_ID;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.STREAM_RESPONSE, 2);
  buf.writeUInt32LE(streamId, 3);

  return buf;
};

const inspect = (appName) => {
  const appNameLength = appName.length;
  const size = CHUNK_SIZE + CHUNK_TYPE + appNameLength;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.INSPECT, 2);
  buf.write(appName, 3);

  return buf;
};

const inspectResponse = (app) => {
  const appLength = app.length;
  const size = CHUNK_SIZE + CHUNK_TYPE + appLength;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.INSPECT_RESPONSE, 2);
  buf.write(app, 3);

  return buf;
};


const call = (callOptions) => {
  const callOptionsLength = callOptions.length;
  const size = CHUNK_SIZE + CHUNK_TYPE + callOptionsLength;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.CALL, 2);
  buf.write(callOptions, 3);

  return buf;
};

const callback = (result) => {
  const resultLength = result.length;
  const size = CHUNK_SIZE + CHUNK_TYPE + resultLength;
  const buf = Buffer.alloc(size);

  buf.writeUInt16LE(size);
  buf.writeUInt8(chunkTypes.CALLBACK, 2);
  buf.write(result, 3);

  return buf;
};

module.exports = {
  streamChunk,
  stream,
  streamResponse,
  inspect,
  inspectResponse,
  call,
  callback,
  chunkTypes
};
