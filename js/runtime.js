/**
 * A provider for the freedom.js runtime.
 * Implements the core.runtime functionality for migration of modules from
 * remote contexts into or through this hub.
 * @constructor
 * @private
 */
var Runtime_chrome = function(app) {
  this.app = app;
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
