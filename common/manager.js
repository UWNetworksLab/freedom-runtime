var window = {};
var webserver = freedom.webserver();
var runtime = freedom['core.runtime']();

var onload = function() {
  webserver.on('connection', function(channelInfo) {
    // TODO: migrate the app to the extension.
  });

  webserver.emit('start', {host: '127.0.0.1', port: 9009});
  console.log('Starting FreeDOM Manager Root Module');
  freedom.emit('ready', {});
}

onload();
