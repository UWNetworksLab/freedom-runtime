chrome.runtime.onInstalled.addListener(function() {
  console.log("FreeDOM Manager installed");
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
