/**
 * A provider for the freedom.js runtime.
 * Implements the core.runtime functionality for migration of modules from
 * remote contexts into or through this hub.
 * @constructor
 * @private
 */
var Runtime_chrome = function(app) {
  this.app = app;
  this.outstandingWork = {};

  this.app.emit(this.app.controlChannel, {
    type: 'Resource Resolver',
    request: 'resource',
    service: 'runtime',
    args: [this.runtimeResolver.bind(this), this.runtimeRetriever.bind(this)]
  });
};

Runtime_chrome.prototype.createApp = function(manifest, proxy, contination) {
  this.app.emit(this.app.controlChannel, {
    type: 'Runtime App @ custom-' + proxy[0] + '.' + proxy[1],
    name: 'custom-' + proxy[0] + proxy[1],
    request: 'port',
    service: 'App',
    args: manifest
  });
};

//Resolve resource://<url> urls.
Runtime_chrome.prototype.runtimeResolver = function(manifest, url, deferred) {
  if (manifest.indexOf("runtime://") === 0) {
    console.log('asked to resolve file ' + url);
    return true;
  }
  return false;
};

//Retreive runtime://<manifest>#<resource> addresses.
Runtime_chrome.prototype.runtimeRetriever = function(url, deferred) {
  var resource, req;

  resource = url.substr(10).split('#');
  req = resource[1];
  this.outstandingWork[req] = deferred;
  this.dispatchEvent('needFile', [resource[0], req]);
};

Runtime_chrome.prototype.resolve = function(file, data, continuation) {
  if (this.outstandingWork[file]) {
    console.log('yay');
    this.outstandingWork[file].resolve(data);
    delete this.outstandingWork[file];
  }
  continuation();
};
