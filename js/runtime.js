/**
 * A provider for the freedom.js runtime.
 * Implements the core.runtime functionality for migration of modules from
 * remote contexts into or through this hub.
 * @constructor
 * @private
 */
var Runtime_chrome = function(channel) {
  this.app = channel;
};

