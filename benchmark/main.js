var runtime = freedom['core.runtime']();
var core = freedom.core();
var channels = [];
var msgs = 0;
var start = (new Date()).valueOf();

var onPage = function(page) {
  msgs += 1;
  var date = ((new Date()).valueOf() - start) / 1000;
  var rate = msgs / date;
  freedom.emit('rate', rate);
};

var work = function(channel) {
  
};

core.createChannel().done(function(channel) {
  runtime.createApp("task.json", channel.identifier);
  channel.channel.done(function(chan) {
    work(chan);
    chan.on('page', onPage);
    chan.emit('render', [10, 'test message']);
  });
});

