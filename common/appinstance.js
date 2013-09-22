var AppInstance = function(postMessage) {
  this.postMessage = postMessage;
  this.manifests = {};
  this.runtimes = {};
  this.state = 0;
};

AppInstance.prototype.registerManifest = function(manifest) {
  this.manifests[manifest] = true;
  if(!manifests[manifest]) {
    manifests[manifest] = this;
  }
};

/**
 * Figure out what is at a URL referenced in an App.
 * The Data is known by the location where the app is actually running,
 * but may not be accessible to an arbitrary runtime - either for
 * CORS or for network accessibility reasons.  As such, when freedom
 * doesn't have data locally and can't resolve it, we resolve the file
 * for the framework.
 */
AppInstance.prototype.resolve = function(manifest, url) {
  this.postMessage('runtime', {
    request: 'load',
    url: url,
    from: manifest
  });
};

AppInstance.prototype.onMessage = function(source, msg) {
  if (this.state === 0 && source === 'control') {
    // Initial request to setup channel
    this.state = 1;
    this.channel = msg.channel;
    this.config = msg.config;
  } else if (source === 'runtime' && msg.response === 'load') {
    console.log("Resolved data for " + msg.file);
    runtime.resolve(msg.file, msg.data);
  } else if (source === 'control' && msg.type ==='createLink') {
    this.proxyChannel = msg.channel;
    // Link to runtime proxy
    this.postMessage(msg.channel, {
      type: 'bindChannel',
      channel: msg.reverse
    });
  } else if (source === 'runtime' && msg.request ==='createApp') {
    this.registerManifest(msg.from);
    runtime.createApp("runtime://" + msg.from + "#" + msg.to, msg.channel);
  } else {
    console.log('Got unknown thing!', msg);
  }
};

AppInstance.prototype.close = function() {
  this.state = 0;
  // Unregister manifests.
  for (var i in this.manifests) {
    if (manifests[i] === this) {
      delete manifests[i];
    }
  }
};
