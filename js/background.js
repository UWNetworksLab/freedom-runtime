window.freedomcfg = function(register) {
  //register("core.view", View_oauth);
  register("core.socket", Socket_chrome);
  //register("core.storage", Storage_chrome);
}

//Start FreeDOM
var script = document.createElement('script');
script.setAttribute('data-manifest', 'common/manager.json');
  // true if in Blobs/WebWorkers, false in frames
script.textContent = '{"strongIsolation": true, "stayLocal": true}';
script.src = 'common/freedom/freedom.js';
document.head.appendChild(script);

//Event Listeners
chrome.runtime.onInstalled.addListener(function() {
  console.log("FreeDOM Manager installed");
  freedom.on('ready', function(data) {
    console.log('Ready!');
  });
});

chrome.app.runtime.onLaunched.addListener(function() {
  console.log("FreeDOM Manager launched");
  chrome.app.window.create('options.html', {
    bounds: {
      width: 800,
      height: 600,
      left: 100,
      top: 100
    },
    minWidth: 800,
    minHeight: 600
  });
});

chrome.runtime.onSuspend.addListener(function() {
  console.log("FreeDOM Manager suspended");
});
