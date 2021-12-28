'use strict';

// Print something
console.log('From application global context');

// Declare function for timer event
function timerEvent() {
  console.log('From application timer event');
}

// Create timer
const write = (filename, data) => fs.writeFile(filename, data, (err) => {
  for (let i = 0; i < 1000000; i++) { }
  console.log('write successfully completed');
});

const read = (filename) => fs.readFile(filename, 'utf8', (err, data) => {
  for (let i = 0; i < 500000; i++) { }
  console.log('read successfully completed');
});

for (let i = 0; i < 10; i++) {
  const msec = Math.floor(Math.random() * 10000);
  timers.setTimeout(write, msec, './someData.txt', 'Adding some data...');
}

for (let i = 0; i < 10; i++) {
  const msec = Math.floor(Math.random() * 10000);
  timers.setTimeout(read, msec, './README.md');
}
