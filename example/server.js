'use strict';

const mhp = require('../');

const app = new mhp.Application('test', {
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
});

const s = new mhp.Server([app]);

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
