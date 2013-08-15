var window;
if (!window) {
  window = {};
}

/**
 * States of the parser in frame stream.
 */
var WS_STATES = {
    READY:      0,
    HEADER:     1,
    PAYLOAD:    2,
    COMPLETE:   3
};

/**
 * Common flags required for bit operations.
 */
var WS_FLAGS = {
    FIN:            0x80,
    RSV1:           0x40,
    RSV2:           0x20,
    RSV3:           0x10,
    OPCODE:         0x0f,
    MASKED:         0x80,
    LENGTH:         0x7f,
    LENGTH_EXT:     0x7e,
    LENGTH_EXT2:    0x7f
};

/**
 * WebSocketParser
 *
 * Inherits from stream.Transform in order to parse WebSocket frames.
 */
function WebSocketParser() {
    this.state = WS_STATES.READY;
    this.callbacks = {};

    this.buffer = null;
    this.data = [];
}

/**
 * Adds a new chunk to the buffer to be processed
 *
 * @param   {ArrayBuffer} chunk
 */
WebSocketParser.prototype.addToArrayBuffer = function(chunk) {
  if (this.buffer) {
    var tmp = new Uint8Array( this.buffer.byteLength + chunk.byteLength );
    tmp.set( new Uint8Array( this.buffer ), 0 );
    tmp.set( new Uint8Array( chunk ), this.buffer.byteLength );
    this.buffer = tmp.buffer;
  } else {
    this.buffer = chunk;
  }
};

/**
 * Transforms incoming WebSocket frames into readable objects.
 *
 * @param   {ArrayBuffer}    chunk
 * @param   {String}    encoding
 * @param   {Function}  callback
 */
WebSocketParser.prototype.parse = function(chunk) {
  this.addToArrayBuffer(chunk);
  this.executeParserLoop();
};

WebSocketParser.prototype.on = function(type, cb) {
  this.callbacks[type] = cb;
};

WebSocketParser.prototype.emit = function(type, msg) {
  if (this.callbacks[type]) {
    this.callbacks[type](msg);
  }
};

/**
 * Starts executing the parser loop.
 *
 * An extra function for this is required as we need to parse
 * recursive. For example when we have multiple frames in one write
 * operation "_transform" itself would not be called again.
 *
 */
WebSocketParser.prototype.executeParserLoop = function() {
    if (this.state == WS_STATES.READY)
        this.handleReadyState();

    if (this.state == WS_STATES.HEADER)
        this.handleHeaderState();
 
    if (this.state == WS_STATES.PAYLOAD)
        this.handlePayloadState();
 
    if (this.state == WS_STATES.COMPLETE)
        this.handleCompleteState();
};

/**
 * Internal handler for ready state.
 * 
 * Sets or resets internal counters for a new frame.
 */
WebSocketParser.prototype.handleReadyState = function() {
    this.header = {};
    this.headerSize = 0;
    this.bytesParsed = 0;

    this.emit('begin');
    
    this.state++;
};

/**
 * Internal handler for header state.
 *
 * Will calculate the header size after it has at least two bytes
 * which are enough to determinate how much bytes must be buffered
 * in order to have all information about the frame.
 */
WebSocketParser.prototype.handleHeaderState = function() {
    var chunk = this.buffer;

    if (!this.headerSize) {
        if (chunk.length < 2) return;
        this.headerSize = this.calculateHeaderSize(chunk);
    }
    if (chunk.byteLength < this.headerSize) return;

    var leftover = this.parseHeaderBytes(this.header, chunk);
    this.buffer = leftover;

    this.emit('header', this.header);

    this.state++;
};

/**
 * Internal handler for payload state.
 *
 * Will unmask the payload if neccessary and push it to be readable
 * until we reach the defined frame length.
 *
 */
WebSocketParser.prototype.handlePayloadState = function() {
  var chunk = this.buffer;
  var needToParse = this.header.length - this.bytesParsed;

  if (needToParse < chunk.byteLength) {
    var newFrame = chunk.slice(needToParse);
    chunk = chunk.slice(0, needToParse);
  }
 
  if (this.header.masked) {
    chunk = this.unmask(this.header.masking, chunk, this.bytesParsed);
  }

  this.bytesParsed += chunk.byteLength;
  this.data = chunk;

  if (newFrame) {
    this.buffer = newFrame;
  } else {
    this.buffer = null;
  }
    
  if (this.bytesParsed == this.header.length) 
    this.state++;
};

/**
 * Internal handler for complete state.
 *
 * Is executed as last handler in order to reset the parser to
 * start processing a new frame.
 */
WebSocketParser.prototype.handleCompleteState = function() {
    this.state = WS_STATES.READY;

    this.emit('frame', this.data);
    this.data = null;

    if (this.buffer && this.buffer.byteLength) {
      this.executeParserLoop();
    }
};

/**
 * Returns frame header size.
 *
 * This helps to determinate when we can stop buffer chunk in order
 * to parse it as head bytes.
 *
 * @param   {ArrayBuffer}    chunk
 * @return  {Number}
 */
WebSocketParser.prototype.calculateHeaderSize = function(ab) {
    var chunk = new Uint8Array(ab);
    var headSize = 2;

    switch (WS_FLAGS.LENGTH & chunk[1]) {
        case WS_FLAGS.LENGTH_EXT:
            headSize += 2;
            break;
        case WS_FLAGS.LENGTH_EXT2:
            headSize += 8;
            break;
    }
    
    if (WS_FLAGS.MASKED & chunk[1])
        headSize += 4;

    return headSize;
};

/**
 * Parses all header bytes of a WebSocket frame.
 *
 * Will extract all information from a WebSocket frame header and
 * then return the non-header left-over in supplied with the chunk.
 *
 * @param   {Object}    header
 * @param   {ArrayBuffer}    chunk
 * @return  {ArrayBuffer}
 */
WebSocketParser.prototype.parseHeaderBytes = function(header, ab) {
    var chunk = new Uint8Array(ab);
    header.fin    = !!(WS_FLAGS.FIN & chunk[0]);
    header.rsv1   = !!(WS_FLAGS.RSV1 & chunk[0]);
    header.rsv2   = !!(WS_FLAGS.RSV2 & chunk[0]);
    header.rsv3   = !!(WS_FLAGS.RSV3 & chunk[0]);
    header.masked = !!(WS_FLAGS.MASKED & chunk[1]);
    
    header.length = WS_FLAGS.LENGTH & chunk[1];
    header.opcode = WS_FLAGS.OPCODE & chunk[0];
        
    ab = ab.slice(2);

    switch (header.length) {
        case WS_FLAGS.LENGTH_EXT:
            var chunk16 = new Uint16Array(ab.slice(0,2));
            header.length = chunk16[0];
            ab = ab.slice(2);
            break;
        
        case WS_FLAGS.LENGTH_EXT2:
            var chunk32 = new Uint32Array(ab.slice(0,4));
            header.length = chunk32[1];
            ab = ab.slice(8);
            break;
    }

    if (header.masked) {
        header.masking = ab.slice(0, 4);
        ab = ab.slice(4);
    }

    return ab;
};

/**
 * Unmasks a masked WebSocket frame payload.
 *
 * @param   {ArrayBuffer}    masking
 * @param   {ArrayBuffer}    payload
 * @param   {Number}    offset
 * @return  {ArrayBuffer}
 */
WebSocketParser.prototype.unmask = function(abmasking, abpayload, offset) {
  var masking = new Uint8Array(abmasking);
  var payload = new Uint8Array(abpayload);
  for (var i = 0; i < payload.length; i++) {
    payload[i] = payload[i] ^ masking[(i + offset) % 4];
  }

  return payload.buffer;
};

WebSocketParser.prototype.testframe = function() {
  var t = new Uint8Array(4);
  t[0] = 0x81;
  t[1] = 0x02;
  t[2] = 0x48;
  t[3] = 0x49;
  return t.buffer;
}

/**
 * Creates a WebSocket Frame around a string
 * String can be up to (and not including) 2^32 in length
 *
 * @param   {String} str
 * @return  {ArrayBuffer}
 **/
WebSocketParser.prototype.wrap = function(str) {
  var data = str2ab(str);
  if (data.byteLength < 126) {
    return this._wrapSmall(data);
  } else if (data.byteLength <= 0xffff) {
    return this._wrapMedium(data);
  } else {
    return this._wrapBig(data);
  }
};

/**
 * Creates a WebSocket Frame around an ArrayBuffer
 * where data.byteLength < 126
 *
 * @param   {ArrayBuffer}  data
 * @return  {ArrayBuffer}
 */
WebSocketParser.prototype._wrapSmall = function(data) {
  var buf = new Uint8Array(2+data.byteLength)
  buf[0] = 0x81;
  buf[1] = data.byteLength & 0x7f;
  buf = copyab(buf, data, 2);
  return buf.buffer;
};

/**
 * Creates a WebSocket Frame around an ArrayBuffer
 * where 126 <= data.byteLength < 2^16
 *
 * @param   {ArrayBuffer}  data
 * @return  {ArrayBuffer}
 */
WebSocketParser.prototype._wrapMedium = function(data) {
  var buf = new Uint8Array(4+data.byteLength)
  buf[0] = 0x81;
  buf[1] = 0x7e;
  buf[2] = (data.byteLength >> 8) & 0xff;
  buf[3] = data.byteLength & 0xff;
  buf = copyab(buf, data, 4);
};

/**
 * Creates a WebSocket Frame around a ArrayBuffer
 * where 2^16 <= data.byteLength < 2^32
 * WebSockets theoretically can store data up to 2^64 in length,
 * but byteLength is a 32-bit int right now
 *
 * @param   {ArrayBuffer}  data
 * @return  {ArrayBuffer}
 */
WebSocketParser.prototype._wrapBig = function(data) {
  //64-bit Lengths, no masking
  var buf = new Uint8Array(10+data.byteLength);
  buf[0] = 0x81;
  buf[1] = 0x7f;
  if (data.byteLength < 0xffffffff) {
    //Max length is 2^32 right now  
    buf = addLength(buf, data.byteLength, 2);
    buf = copyab(buf, data, 10); 
  } else {
    buf = addLength(buf, 0xffffffff, 2);
    buf = copyab(buf, data.slice(0, 0xffffffff), 10);
  }
  return buf.buffer;
};

/*
 * Converts a String to an ArrayBuffer
 *
 * @param   {String} str
 * @return  {ArrayBuffer}
 */
function str2ab(str) {
  var buf = new ArrayBuffer(str.length); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/**
 * Adds the integer n to the destination at offset
 * Limited to 32-bit integers
 *
 * @param   {Uint8Array} dest
 * @param   {int} n
 * @param   {int} offset
 */
function addLength(dest, n, offset) {
  for (var i=0; i<4; i++) {
    dest[offset+i] = 0x00;
  }
  for (var i=4; i<8; i++) {
    dest[offset+i] = (n >> ((7-i)*8)) & 0xFF
  }
  return dest;
}

/*
 * Copies the ArrayBuffer into the destination starting at an offset
 *
 * @param   {Uint8Array} dest
 * @param   {ArrayBuffer} src
 * @param   {int} offset
 */
function copyab(dest, src, offset) {
  if (dest.byteLength < (src.byteLength+offset)) {
    console.log("Buffer overflow");
    return dest;
  }
  var src8 = new Uint8Array(src);
  for (var i=0; i<src.byteLength; i++) {
    dest[offset+i] = src8[i];
  }
  return dest;
}
