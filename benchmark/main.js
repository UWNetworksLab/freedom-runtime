var runtime = freedom['core.runtime']();
var core = freedom.core();
var msgs = 0;
var stop = false;

freedom.on('stop', function() {
  stop = true;
});

var onPage = function(channel, page) {
  msgs += 1;
  if (!stop) {
    work(channel);
  }
};

var stat = function() {
  freedom.emit('rate', msgs);
  msgs = 0;
};
setInterval(stat, 1000);

var work = function(channel) {
  channel.emit('render', [10, 'test message']);
};

freedom.on('launch', function() {
  core.createChannel().done(function(channel) {
    runtime.createApp("task.json", channel.identifier);
    channel.channel.done(function(chan) {
      chan.on('page', onPage.bind({}, chan));
      work(chan);
    });
  });
});