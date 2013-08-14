'use strict';

/**
 * Convert a freedom promise-style interface into a
 * callback-style interface as used in the Chrome API.
 */
var promise2callback = function(object) {
  for (var prop in object) {
    if (object.hasOwnProperty(prop) && typeof object[prop] === 'function') {
      var orig = object[prop];
      var shim = function(base) {
        var args = [];
        for (var i = 1; i < arguments.length - 1; i++) {
          args.push(arguments[i]);
        }
        var cb = arguments[arguments.length - 1];
        var promise = base.apply(object, args);
        promise.done(cb);
      }.bind(object, orig);
      object[prop] = shim;
    }
  }
  return object;
}

function resolvePath(url) {
  var from = location.protocol+location.host+location.pathname;
  var protocols = ["http", "https", "chrome-extension", "resource"];
  for (var i = 0; i < protocols.length; i++) {
    if (url.indexOf(protocols[i] + "://") === 0) {
      return url;
    }
  }

  var dirname = from.substr(0, from.lastIndexOf("/"));
  var protocolIdx = dirname.indexOf("://");
  var pathIdx = protocolIdx + 3 + dirname.substr(protocolIdx + 3).indexOf("/");
  var path = dirname.substr(pathIdx);
  var base = dirname.substr(0, pathIdx);
  if (url.indexOf("/") === 0) {
    return base + url;
  } else {
    return base + path + "/" + url;
  }

}

