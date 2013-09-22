var runtime = freedom['core.runtime']();
var core = freedom.core();
var channels = [];
var msgs = 0;

var onPage = function(page) {
  msgs += 1;
};

core.createChannel().done(function(channel) {
  runtime.createApp("task.json", channel.identifier);
  channel.channel.done(function(chan) {
    chan.on('page', onPage);
    chan.emit('render', [10, 'test message']);
  });
});

