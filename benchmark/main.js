var runtime = freedom['core.runtime']();
var core = freedom.core();
var channels = [];
var msgs = 0;
var start = (new Date()).valueOf();
var stop = false;

freedom.on('stop', function() {
  stop = true;
});

var onPage = function(channel, page) {
  msgs += 1;
  if (!stop) {
    work(channel);
  } else {
    stat();
  }
  if (msgs % 100 === 0) {
    setTimeout(stat, 0);
  }
};

var stat = function() {
  var date = ((new Date()).valueOf() - start) / 1000;
  var rate = msgs / date;
  freedom.emit('rate', rate);
};

var work = function(channel) {
  channel.emit('render', [10, 'test message']);
};

core.createChannel().done(function(channel) {
  runtime.createApp("task.json", channel.identifier);
  channel.channel.done(function(chan) {
    chan.on('page', onPage.bind({}, chan));
    work(chan);
  });
});