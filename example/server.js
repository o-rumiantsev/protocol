'use strict';

const mhp = require('../');

const api = {
  math: {
    add(a, b, callback) {
      const res = a + b;
      callback(null, res);
    }
  },
  words: {
    toUpper(word, callback) {
      callback(null, word.toUpperCase());
    }
  }
};

const app = new mhp.Application('test', api);

const server = new mhp.Server([app]);

server.listen(3000, 'localhost', () => {
  console.log('MHP srver bound');
});

server.on('connection', (connection) => {
  connection.on('incomingStream', (stream) => {
    console.log('incoming stream');
    stream.on('data', (chunk) => {
      console.log('bytes recieved', chunk.length);
    });
  });
});
