function registerRules() {
  var injection = chrome.extension.getURL("js/inject.js");
  var rule = {
    priority: 100,
    conditions: [
      new chrome.declarativeWebRequest.RequestMatcher({
        url: {hostEquals: '127.3733366'}
      }),
      new chrome.declarativeWebRequest.RequestMatcher({
        url: {hostEquals: '127.56.247.118'}
      })
    ],
    actions: [
      new chrome.declarativeWebRequest.RedirectRequest({
        redirectUrl: injection
      })
    ]
  };
  
  var callback = function() {
    if (chrome.runtime.lastError) {
      console.error('Error adding rules: ' + chrome.runtime.lastError);
    } else {
      console.info('Rules successfully installed');
    }
  };

  chrome.declarativeWebRequest.onRequest.addRules([rule], callback);
}

function setup() {
  chrome.declarativeWebRequest.onRequest.removeRules(null, function() {
    if (chrome.runtime.lastError) {
      console.error('Error clearing rules: ' + chrome.runtime.lastError);
    } else {
      registerRules();
    }
  });
}

chrome.runtime.onInstalled.addListener(setup);
