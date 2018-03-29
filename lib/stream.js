'use strict';

const { Readable, Duplex } = require('stream');
const chunks = require('./chunks.js');
const CHUNK_MAX_SIZE = 16384;


const newReadable = () => {
  const stream = new Readable();
  stream._read = () => {};
  stream.orderUnshift = orderifyUnshift(stream);
  return stream;
};


const newDuplex = (connection, streamId) => {
  const stream = new Duplex();
  stream._read = () => {};
  stream.write = (chunk, cb) => {
    const buf = Buffer.from(chunk);
    stream.push(buf);
    if (cb) cb();
  };

  let packetId = 1;

  const sendDataChunk = (dataChunk) => {
    const chunk = dataChunk.slice(0, CHUNK_MAX_SIZE);
    const streamData = chunks.streamPreamble(streamId, packetId, chunk);
    connection._send(streamData);
    ++packetId;

    if (dataChunk.length > CHUNK_MAX_SIZE) {
      sendDataChunk(dataChunk.slice(CHUNK_MAX_SIZE));
    }
  };

  stream.on('data', sendDataChunk);

  return stream;
};

function orderifyUnshift(readable) {
  const packets = [];
  let waitingPacketId = 1;

  const checkForWaitingPacket = () => {
    const waitingPacket = packets.find(
      packet => packet.packetId === waitingPacketId
    );

    if (waitingPacket) {
      readable.unshift(waitingPacket.buffer);
      ++waitingPacketId;

      const index = packets.indexOf(waitingPacket);
      packets.splice(index, 1);

      checkForWaitingPacket();
    }
  };

  return ({ packetId, buffer }) => {
    if (packetId === waitingPacketId) {
      readable.unshift(buffer);
      ++waitingPacketId;
      checkForWaitingPacket();
    } else {
      packets.push({ packetId, buffer });
    }
  };
}

module.exports = {
  newReadable,
  newDuplex,
};
