var window = {};
var webserver = freedom.webserver();

var onload = function() {
  webserver.emit('start', {host: '127.0.0.1', port: 9009});
  console.log('Starting FreeDOM Manager Root Module');
  freedom.emit('ready', {});
}

onload();
//Autostop the server
setTimeout(function() {
//  webserver.emit('stop', '');
}, 10000)
