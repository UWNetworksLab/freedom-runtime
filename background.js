chrome.app.runtime.onLaunched.addListener(function(launchData) {
  runApp(launchData);
});

chrome.app.runtime.onRestarted.addListener(function(launchData) {
  runApp(launchData);
});

function runApp(launchData) {
  console.log(launchData);
  chrome.app.window.create('options.html', {
    id: "Options",
  });
}