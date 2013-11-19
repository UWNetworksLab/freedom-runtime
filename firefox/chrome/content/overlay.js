window.addEventListener('load', function loadFreedom() {
  // Freedom must run after the window has loaded because the
  // data-manifest attribute isn't loaded yet, so we load freedom
  // dynamically.
  // This is a pretty nasty hack. For some reason appending a script
  // tag for freedom after the page has loaded doesn't do anything, so
  // we append the script tag and then use mozIJSSubScriptLoader to
  // actually run the script. Freedom will still think it loaded from
  // a script tag and pull the proper manifest file.
  var script = document.createElement('script');
  script.setAttribute("type", "application/javascript");
  script.setAttribute('data-manifest',
                      'chrome://freedom-runtime-common/content/manager.json');
  script.textContent = '{"strongIsolation": true, "stayLocal": true}';
  script.src = 'chrome://freedom-runtime-common/content/freedom/freedom.js';
  document.documentElement.appendChild(script);

  var mozIJSSubScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
        .getService(Components.interfaces.mozIJSSubScriptLoader);
  // increase timeout to open debugger in time!
  setTimeout(function() {
  mozIJSSubScriptLoader.loadSubScript('chrome://freedom-runtime-common/content/freedom/freedom.js');
  }, 0);
}, false);
