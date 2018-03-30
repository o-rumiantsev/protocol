'use strict';

const { Readable, Duplex } = require('stream');
const chunks = require('./chunks.js');
const config = require('../config/stream.json');


const newReadable = () => {
  const stream = new Readable();
  stream._read = () => {};
  stream.orderUnshift = orderifyUnshift(config, stream);
  return stream;
};


const newDuplex = (connection, streamId) => {
  const { maxChunkSize } = config;
  let { packetId } = config;

  const stream = new Duplex();
  stream._read = () => {};
  stream.write = (chunk, cb) => {
    const buf = Buffer.from(chunk);
    stream.push(buf);
    if (cb) cb();
  };

  const sendDataChunk = (chunk) => {
    const chunkSlice = chunk.slice(0, maxChunkSize);
    const streamData = chunks.streamPreamble(
      streamId,
      packetId,
      chunkSlice
    );
    connection._send(streamData);
    ++packetId;

    if (chunk.length > maxChunkSize) {
      sendDataChunk(chunk.slice(maxChunkSize));
    }
  };

  stream.on('data', sendDataChunk);

  return stream;
};

function orderifyUnshift(config, readable) {
  const packets = [];
  let { nextPacketId } = config;

  const checkForNextPacket = () => {
    const nextPacket = packets.find(
      packet => packet.packetId === nextPacketId
    );

    if (nextPacket) {
      readable.unshift(nextPacket.buffer);
      ++nextPacketId;

      const index = packets.indexOf(nextPacket);
      packets.splice(index, 1);

      checkForNextPacket();
    }
  };

  return ({ packetId, buffer }) => {
    if (packetId === nextPacketId) {
      readable.unshift(buffer);
      ++nextPacketId;
      checkForNextPacket();
    } else {
      packets.push({ packetId, buffer });
    }
  };
}

module.exports = {
  newReadable,
  newDuplex,
};
