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
    type: 'RuntimeApp',
    request: 'bindapp',
    to: proxy[0],
    port: proxy[1],
    id: manifest
  });
};

//Resolve resource://<url> urls.
Runtime_chrome.prototype.runtimeResolver = function(manifest, url, deferred) {
  var resource, mbase;

  if (manifest.indexOf("runtime://") === 0) {
    resource = manifest.substr(10).split('#');
    mbase = resource[1];
    this.app.config.resources.get(mbase, url).done(function(deferred, url) {
      deferred.resolve(url);
    }.bind(this, deferred));
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
    this.outstandingWork[file].resolve(data);
    delete this.outstandingWork[file];
  }
  continuation();
};
