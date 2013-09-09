var window;
if (!window) {
  window = {};
}
window.socket = freedom['core.socket']();
var WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

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

var Server = function(address, port) {
  window.current = this;
  this.tcpServer = new window.TcpServer(address || '127.0.0.1', port || 9009);
  this.tcpServer.on('listening', (function() {
    console.log('LISTENING '+this.tcpServer.addr+':'+this.tcpServer.port);
  }).bind(this));
  this.tcpServer.on('disconnect', function() {
    console.log('SERVER STOP');
  });
  this.tcpServer.on('connection', this._onConnection.bind(this));
}

Server.prototype._onConnection = function(connection) {
  console.log('CONNECTED('+connection.socketId+') '+
              connection.socketInfo.peerAddress+':'+connection.socketInfo.peerPort);
  var wsParser = new WebSocketParser();
  connection.on('recv', this._onRecv.bind(this, connection, wsParser));
  wsParser.on('begin', function() {});
  wsParser.on('header', function(header) {
    console.log(JSON.stringify(header));
  });
  wsParser.on('frame', function(data) {
    console.log(getStringOfArrayBuffer(data));
  });
};

Server.prototype._onRecv = function(connection, wsParser, buffer) {
  console.log('Socket '+connection.socketId+' got data');
  var reqStr = getStringOfArrayBuffer(buffer);
  var req = this.parseGet(reqStr);
  if (req['Connection'] && req['Connection']=='Upgrade' && 
      req['Upgrade'] && req['Upgrade'] == 'websocket' && 
      req['Sec-WebSocket-Key']) {
    var wsKey = req['Sec-WebSocket-Key']+WS_MAGIC;
    var wsAccept = CryptoJS.SHA1(wsKey).toString(CryptoJS.enc.Base64);
    var header = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"+
                 //"Sec-WebSocket-Protocol: freedomv1\r\n"+
                 "Sec-WebSocket-Accept: "+wsAccept+"\r\n\r";
    //Note: connection.send automatically appends another \n
    connection.send(header);
    window.conn = connection;
    window.wsparser = wsParser;
  } else {
    wsParser.parse(buffer);
  }
};

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
};

onload();
