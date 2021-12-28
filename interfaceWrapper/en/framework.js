'use strict';

// Wrapping function and interface example

global.api = {};
api.fs = require('fs');
api.vm = require('vm');
api.timers = require('timers');

const EventEmitter = require('events');
const ee = new EventEmitter();

const stats = {
  fnCalls: 0,
  cbCalls: 0,
  execTime: 0,
  cbTime: 0,
  sizeRead: 0,
  sizeWritten: 0,
  writeTime: 0,
  readTime: 0
}

const interfaceWrapper = (anInterface) => {
  const clone = {};
  for (const key in anInterface) {
    clone[key] = wrapFunction(key, anInterface[key]);
  }
  return clone
}

const wrapFunction = (fnName, fn) => (...args) => {
  const lastArg = args[args.length - 1];
  const fnStart = new Date().getTime();
  ee.emit('fnCall', fnName);
  if (typeof lastArg === 'function') {
    const cb = (err, data) => {
      if (err) return;
      if (fnName.includes('read')) ee.emit('read', data.length, readStart);
      else if (fnName.includes('write')) ee.emit('write', args[1].length, writeStart);
      const cbStart = new Date().getTime();
      ee.emit('cbStart', fnName);
      lastArg(err, data);
      ee.emit('cbEnd', cbStart);
      ee.emit('fnEnd', fnStart);
    }
    args[args.length - 1] = cb;
    const readStart = new Date().getTime();
    const writeStart = new Date().getTime();
    fn(...args);
  } else {
    const res = fn(...args);
    ee.emit('fnEnd', fnStart);
    return res;
  }
}

ee.on('fnCall', (name) => {
  console.log(`function call: ${name}`);
  stats.fnCalls++;
});
ee.on('fnEnd', (start) => {
  const diff = new Date().getTime() - start;
  stats.execTime = stats.fnCalls === 1 ? diff : (stats.execTime * (stats.fnCalls - 1) + diff) / stats.fnCalls;
});
ee.on('cbStart', (name) => {
  stats.cbCalls++;
  console.log(`callback call: ${name}`);

});
ee.on('read', (size, start) => {
  stats.sizeRead += size;
  const diff = new Date().getTime() - start;
  stats.readTime = stats.cbCalls === 0 ? diff : (stats.readTime * stats.cbCalls + diff) / (stats.cbCalls + 1);
});
ee.on('write', (size, start) => {
  stats.sizeWritten += size;
  const diff = new Date().getTime() - start;
  stats.writeTime = stats.cbCalls === 0 ? diff : (stats.writeTime * stats.cbCalls + diff) / (stats.cbCalls + 1);
});
ee.on('cbEnd', (start) => {
  const diff = new Date().getTime() - start;
  console.dir({diff})
  stats.cbTime = stats.cbCalls === 1 ? diff : (stats.cbTime * (stats.cbCalls - 1) + diff) / stats.cbCalls;
});


// Create a hash for application sandbox
const context = {
  module: {},
  console,
  Math,
  // Forward link to fs API into sandbox
  fs: interfaceWrapper(api.fs),
  //fs: interfaceWrapper(api.fs);
  // Wrapper for setTimeout in sandbox
  timers: api.timers,
};
//timeout: (msec, cb) => setTimeout(cb, msec) 
// Turn hash into context
context.global = context;
const sandbox = api.vm.createContext(context);

// Read an application source code from the file
const fileName = './application.js';
api.fs.readFile(fileName, 'utf8', (err, src) => {
  // Run an application in sandboxed context
  const script = api.vm.createScript(src, fileName);
  script.runInNewContext(sandbox);
});
api.timers.setInterval(() => console.dir({ stats }), 30000);
