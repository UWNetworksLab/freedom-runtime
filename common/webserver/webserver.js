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

var id = 0;
var nextId = function() {
  return id++;
};

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

Server.prototype.connections = {};

Server.prototype._onConnection = function(connection) {
  console.log('CONNECTED('+connection.socketId+') '+
              connection.socketInfo.peerAddress+':'+connection.socketInfo.peerPort);
  var parser = new WebSocketParser();
  var id = nextId();
  this.connections[id] = connection;
  connection.on('recv', this._onRecv.bind(this, connection, parser));
  parser.on('begin', function(id) {
    freedom.emit('message', {
      type: 'new',
      id: id
    });
  }.bind({}, id));
  parser.on('header', function(header) {
    console.log(JSON.stringify(header));
  });
  parser.on('frame', function(id, data) {
    var msg = JSON.parse(getStringOfArrayBuffer(data));
    freedom.emit('message', {
      type: 'message',
      id: id,
      data: msg
    });
  }.bind({}, id));

  connection.on('disconnect', function(server, id) {
    freedom.emit('message', {
      type: 'destroy',
      id: id
    });
    delete server.connections[id];
  }.bind({}, this, id));
};

Server.prototype._onRecv = function(connection, parser, buffer) {
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
  } else {
    parser.parse(buffer);
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
  freedom.on('message', function(msg) {
    server.connections[msg.id].send(JSON.stringify(msg.data));
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
