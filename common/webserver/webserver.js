var window = {};
window.socket = promise2callback(freedom['core.socket']());

function parseGet(str) {
  var lines = str.split('\r\n');
  var req = {}
  for (var i=1; i<lines.length; i++) {
    var line = lines[i].split(': ');
    req[line[0]] = line[1];
  }
  req.cmd = lines[0];
  return req;
}

function sendStub(connection) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      console.log(xhr.responseText);
    }
  };
  xhr.open('GET', 'chrome-extension://pekedacphdgiplmopeaplpdndakdefll/common/webserver/stub.js', true);
  xhr.send(null);
/**
  var contentLength = file.size;
  var header = stringToUint8Array("HTTP/1.0 200 OK\r\nContent-length: " + file.size + 
    "\r\nContent-type: text/javascript\n\n");
  var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
  var view = new Uint8Array(outputBuffer)
  view.set(header, 0);
  var fileReader = new FileReader();
  fileReader.onload = function(e) {
  view.set(new Uint8Array(e.target.result), header.byteLength);
  socket.write(socketId, outputBuffer, function(writeInfo) {
  console.log("WRITE", writeInfo);
  if (keepAlive) {
  readFromSocket(socketId);
  } else {
  socket.destroy(socketId);
  socket.accept(socketInfo.socketId, onAccept);
  }
  });
  };
  **/
}

function HttpServer(address, port) {
  window.current = this;
  this.tcpServer = new window.TcpServer(address || '127.0.0.1', port || 9009);
  this.tcpServer.on('listening', (function() {
    console.log('LISTENING '+this.tcpServer.addr+':'+this.tcpServer.port);
  }).bind(this));
  this.tcpServer.on('disconnect', function() {
    console.log('SERVER STOP');
  });
  this.tcpServer.on('connection', function(connection) {
    console.log('CONNECTED('+connection.socketId+') '+connection.socketInfo.peerAddress+':'+connection.socketInfo.peerPort);
    connection.on('recv', function(buffer) {
      console.log('Socket '+connection.socketId+' got data');
      var req = parseGet(getStringOfArrayBuffer(buffer));
      console.log(JSON.stringify(req));
      if (req['Connection'] && req['Connection']=='Upgrade' && req['Upgrade'] && req['Upgrade'] == 'websocket') {
        console.log('Websocket Handshake');
      } else {
        sendStub(connection);
      }
    });
  });
}

HttpServer.prototype.listen = function() {
  this.tcpServer.listen();
};

HttpServer.prototype.disconnect = function() {
  this.tcpServer.disconnect();
};

var onload = function() {
  var http = null;

  freedom.on('start', function(options) {
    if (!http) {
      http = new HttpServer(options.host, options.port);
      http.listen();
    }
  });
  freedom.on('stop', function(data) {
    if (http) {
      http.disconnect();
      http = null;
    }
  });

  freedom.emit('ready', {});
  //socket.create('tcp');
};

//setTimeout(onload, 0);
onload();
