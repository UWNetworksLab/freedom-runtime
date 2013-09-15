var window = {};
var webserver = freedom.webserver();
var runtime = freedom['core.runtime']();
var core = freedom.core();
var apps = {};

var onload = function() {
  webserver.on('message', function(channelInfo) {
    var id = channelInfo.id;
    if (channelInfo.type === 'new') {
      apps[id] = new AppInstance(function(id, source, msg) {
        webserver.emit('message', {'type': 'message', 'id': id, data: [source, msg]});
      }.bind({}, id));
    } else if (channelInfo.type === 'message') {
      apps[id].onMessage(channelInfo.data[0], channelInfo.data[1]);
    } else { //close
      apps[id].close();
      delete apps[id];
    }
    console.log(JSON.stringify(channelInfo));
    // TODO: migrate the app to the extension.
  });

  webserver.emit('start', {host: '127.0.0.1', port: 9009});
  console.log('Starting FreeDOM Manager Root Module');
  freedom.emit('ready', {});
}

onload();
