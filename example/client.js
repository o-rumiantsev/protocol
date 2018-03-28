'use strict';

const fs = require('fs');
const mhp = require('../');

const c = new mhp.Client();

c.connect({
  host: 'localhost',
  port: 3000
});

const fs1 = fs.createReadStream('./client.js');

c.createStream((err, stream) => {
  fs1.pipe(stream);
});
