'use strict';

const fs = require('fs');
const mhp = require('../');

mhp.connect('test', null, 3000, 'localhost', (err, conn, app) => {
  app.math.add(3, 5, (err, res) => {
    console.log('Error:', err, 'Result:', res);
  });

  app.words.toUpper('test', (err, res) => {
    console.log('Error:', err, 'Result:', res);
  });

  const fs1 = fs.createReadStream('./client.js');

  conn.createStream((err, stream) => {
    fs1.pipe(stream);
  });
});
