var window;
if (!window) {
  window = {};
}
var WebSocketMagic = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function sendStub(connection) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      console.log(xhr.responseText);
    }
  };
  xhr.open('GET', 'chrome-extension://pekedacphdgiplmopeaplpdndakdefll/common/webserver/stub.js', true);
  xhr.send(null);
}

function Server(address, port) {
  window.current = this;
  this.tcpServer = new window.TcpServer(address || '127.0.0.1', port || 9009);
  this.tcpServer.on('listening', (function() {
    console.log('LISTENING '+this.tcpServer.addr+':'+this.tcpServer.port);
  }).bind(this));
  this.tcpServer.on('disconnect', function() {
    console.log('SERVER STOP');
  });
  this.tcpServer.on('connection', (function(connection) {
    console.log('CONNECTED('+connection.socketId+') '+connection.socketInfo.peerAddress+':'+connection.socketInfo.peerPort);
    connection.on('recv', (function(buffer) {
      console.log('Socket '+connection.socketId+' got data');
      var reqStr = getStringOfArrayBuffer(buffer);
      var req = this.parseGet(reqStr);
      if (req['Connection'] && req['Connection']=='Upgrade' && 
          req['Upgrade'] && req['Upgrade'] == 'websocket' && 
          req['Sec-WebSocket-Key']) {
        var wsKey = req['Sec-WebSocket-Key']+WebSocketMagic;
        var wsAccept = CryptoJS.SHA1(wsKey).toString(CryptoJS.enc.Base64);
        var header = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"+
                      //"Sec-WebSocket-Protocol: chat\r\n"+
                      "Sec-WebSocket-Accept: "+wsAccept+"\r\n\r\n";
        connection.send(header);
      } else {
        console.log(reqStr);
        connection.send("POOP TEST");
      }
    }).bind(this));
  }).bind(this));
}

Server.prototype.parseGet = function(str) {
  var lines = str.split('\r\n');
  var req = {}
  for (var i=1; i<lines.length; i++) {
    var line = lines[i].split(': ');
    req[line[0]] = line[1];
  }
  req.cmd = lines[0];
  return req;
};

Server.prototype.listen = function() {
  this.tcpServer.listen();
};

Server.prototype.disconnect = function() {
  this.tcpServer.disconnect();
};

var onload = function() {
  var server = null;

  freedom.on('start', function(options) {
    if (!server) {
      server = new Server(options.host, options.port);
      server.listen();
    }
  });
  freedom.on('stop', function(data) {
    if (server) {
      server.disconnect();
      server = null;
    }
  });

  freedom.emit('ready', {});
  //socket.create('tcp');
};

//setTimeout(onload, 0);
onload();
