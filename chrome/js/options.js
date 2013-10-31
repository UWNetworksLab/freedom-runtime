window.addEventListener('load', function() {
  var webview = document.getElementById('portal');
  webview.addEventListener('loadstop', function() {
    setupWebview();
  });
}, true);

var webviewSetup = false;
var setupWebview = function() {
  if (webviewSetup) {
    return;
  } else {
    webviewSetup = true;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/js/portal.js', true);
  xhr.responseType = 'text';
  xhr.onload = function(e) {
    injectWebview(this.response);
  };
  xhr.send();
};

var injectWebview = function(code) {
  var codeWrapper = "localStorage['program'] = \"" + code + "\";reload();";
  var webview = document.getElementById('portal');
  webview.executeScript({
    'code': code
  }, function() {
    webview.contentWindow.postMessage({
      'action': 'registerApp'
    }, '*');
  });
};

window.addEventListener('message', function(m) {
  console.log(m.data);
}, true);