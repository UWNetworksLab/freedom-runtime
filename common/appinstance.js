var AppInstance = function(postMessage) {
  this.postMessage = postMessage;
};

AppInstance.prototype.onMessage = function(msg) {
  console.log(msg);
};
