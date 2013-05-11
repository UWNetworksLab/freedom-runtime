/**
 * Construct a new ServiceAdvertiser. This object listens for mdns discovery
 * requests, and advertises a defined service in response.
 * @see MDNS Browser <a href='https://github.com/GoogleChrome/chrome-app-samples/blob/master/mdns-browser/main.js'>ServiceFinder</a>
 * @see <a href='https://github.com/GoogleChrome/chrome-app-samples/blob/master/multicast/MulticastSocket.js'>Multicast Socket</a>
 * @constructor
 * @param {function} callback The callback to be invoked when this object is
 *                            updated, or when an error occurs (passes string).
 */
var ServiceAdvertiser = function(service) {
  this.sockets_ = [];
  this.service_ = service;

  this.forEachAddress_(function(addr) {
    if (addr.indexOf(':') != -1) {
      return true;
    }
    
    this.bindToAddress_(addr, function(socket) {
      if (chrome.runtime.lastError) {
        console.warn("Could not bind UDP socket: " + chrome.runtime.lastError.message);
        return true;
      }
      this.sockets_.push(socket);
      this.recv_(socket);
    }.bind(this));
  }.bind(this));
};

/**
 * Invokes the callback for every local network address on the system.
 * @private
 * @param {function} cb to invoke
 */
ServiceAdvertiser.prototype.forEachAddress_ = function(cb) {
  if (!chrome.socket.getNetworkList) {
    // Short-circuit for Chrome built before r155662.
    cb('0.0.0.0', '*');
    return true;
  }

  chrome.socket.getNetworkList(function(adapterInfo) {
    adapterInfo.forEach(function(info) {
      cb(info['address'], info['name']);
    });
  });
};

/**
 * Creates UDP socket bound to the specified address, passing it to the
 * callback. Passes null on failure.
 * @private
 * @param {string} address to bind to
 * @param {function} cb to invoke when done
 */
ServiceAdvertiser.prototype.bindToAddress_ = function(address, cb) {
  chrome.socket.create('udp', {}, function(createInfo) {
    chrome.socket.bind(createInfo['socketId'], address, 5353, function(result) {
      cb(createInfo['socketId']);
    });
  });
};

/**
 * Handles incoming UDP packets on a socket.
 * @private
 */
ServiceAdvertiser.prototype.recv_ = function(socket, info) {
  if (chrome.runtime.lastError) {
    console.warn(chrome.runtime.lastError.message);
    return true;
  }

  // Listen for the next packet.
  chrome.socket.recvFrom(socket, this.recv_.bind(this, socket));
  if (!info) {
    return false;
  }

  console.log(info.data);
};
