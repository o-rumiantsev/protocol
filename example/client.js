'use strict';

const fs =require('fs');
const mhp = require('../');

const c = new mhp.Client();

c.connect({
  host: 'localhost',
  port: 3000
});

const call = {
  method: 'power',
  args: [2, 64]
};

const data = JSON.stringify(call);
c.sendData(data);

const fs1 = fs.createReadStream('./client.js');
const fs2 = fs.createReadStream('./server.js');

c.createStream((err, stream) => {
  fs1.pipe(stream);
});

c.createStream((err, stream) => {
  fs2.pipe(stream);
});
