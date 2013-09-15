var AppInstance = function(postMessage) {
  this.postMessage = postMessage;
  this.state = 0;
};

AppInstance.prototype.onMessage = function(source, msg) {
  // Initial request to setup channel
  if (this.state === 0 && source === 'control') {
    this.state = 1;
    this.channel = msg.channel;
    this.postMessage(this.channel, {
      type: 'Runtime State Query',
      request: 'table'
    });
  } else if (this.state === 1 && source === 'control' && msg.table) {
    console.log('Got routing table:');
    console.log(msg.table);
  }
};
