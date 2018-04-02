'use strict';

const common = require('metarhia-common');

const chunks = require('./chunks.js');

function RemoteProxy(connection, name, client) {
  this.connection = connection;
  this.client = client;
  this.appName = name;
  this.callbacks = new Map();
}

RemoteProxy.prototype.fromApi = function(api) {
  const callOptions = (options) => {
    this._call(options);
  };

  const handler = {
    get(app, field) {
      if (!api[field]) return app[field];
      const appInterface = field;
      return new Proxy({}, {
        get(target, field) {
          if (api[appInterface].indexOf(field) < 0) return target[field];
          const method = field;
          return function(...args) {
            callOptions({ appInterface, method, args });
          };
        }
      });
    }
  };

  const app = {};
  return new Proxy(app, handler);
};

RemoteProxy.prototype._call = function(options) {
  const key = common.generateKey(32, common.ALPHA_DIGIT);
  options.key = key;

  const callback = options.args.pop();

  if (typeof callback !== 'function') {
    throw new TypeError('callback argument must be a function');
  }

  const callOptions = JSON.stringify(options);
  const call = chunks.call(callOptions);

  this.connection._send(call);
  this.callbacks.set(key, callback);

  const onRemoteResult = (data) => {
    const callback = this.callbacks.get(data.key);
    if (!callback) return;
    this.connection.removeListener('callback', onRemoteResult);
    this.callbacks.delete(data.key);
    callback(data.error, data.result);
  };

  this.connection.on('callback', onRemoteResult);
};

module.exports = RemoteProxy;
