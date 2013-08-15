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
        if (typeof cb !== 'function') {
          args.push(cb);
          base.apply(object, args);
        } else {
          var promise = base.apply(object, args);
          promise.done(cb);
        }
      }.bind(object, orig);
      object[prop] = shim;
    }
  }
  return object;
}

function makeLogger(level) {
  var logFunc = console[level];
  if (logFunc) {
    return logFunc;
  }
  return function () {
    var s = '[' + level.toUpperCase() + '] ';
    for (var i=0, ii=arguments[i]; i<arguments.length; s+=ii+' ', ii=arguments[++i]) {
      ii = typeof ii === 'string' ? ii :
           ii instanceof Error ? ii.toString() :
           JSON.stringify(ii);
    }
    console.log(s);
  };
}

//== XXX can get rid of these when we include lodash: ==//
function isUndefined(val) {
  return typeof val == 'undefined';
}

function isDefined(val) {
  return typeof val != 'undefined';
}

function cloneDeep(val) {
  return JSON.parse(JSON.stringify(val)); // quick and dirty
}

//======================================================//
