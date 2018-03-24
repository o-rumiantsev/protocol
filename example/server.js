'use strict';

const fs = require('fs');
const mhp = require('../');

const s = new mhp.Server();

s.listen(3000, 'localhost', () => {
  console.log('MHP srver bound');
});

s.on('connection', (transport) => {
  transport.on('incomingStream', (stream) => {
    console.log('incoming stream');
    stream.on('data', (chunk) => {
      console.log('bytes recieved', chunk.length);
    });
  });
});
