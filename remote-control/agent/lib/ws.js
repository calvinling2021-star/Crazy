'use strict';

// Minimal RFC 6455 WebSocket server built on Node's http module.
// No external dependencies so the agent runs anywhere Node does.

const crypto = require('crypto');
const { EventEmitter } = require('events');

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const OP_TEXT = 0x1;
const OP_BINARY = 0x2;
const OP_CLOSE = 0x8;
const OP_PING = 0x9;
const OP_PONG = 0xa;

function acceptKey(key) {
  return crypto.createHash('sha1').update(key + GUID).digest('base64');
}

class Connection extends EventEmitter {
  constructor(socket) {
    super();
    this.socket = socket;
    this.closed = false;
    this._buffer = Buffer.alloc(0);
    this._fragments = [];
    this._fragmentOp = null;

    socket.on('data', (chunk) => this._onData(chunk));
    socket.on('close', () => this._onClose());
    socket.on('error', (err) => this.emit('error', err));
  }

  _onData(chunk) {
    this._buffer = Buffer.concat([this._buffer, chunk]);
    // Parse as many frames as are fully buffered.
    while (true) {
      const frame = this._parseFrame();
      if (!frame) break;
      this._handleFrame(frame);
    }
  }

  _parseFrame() {
    const buf = this._buffer;
    if (buf.length < 2) return null;

    const fin = (buf[0] & 0x80) !== 0;
    const opcode = buf[0] & 0x0f;
    const masked = (buf[1] & 0x80) !== 0;
    let payloadLen = buf[1] & 0x7f;
    let offset = 2;

    if (payloadLen === 126) {
      if (buf.length < offset + 2) return null;
      payloadLen = buf.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLen === 127) {
      if (buf.length < offset + 8) return null;
      const big = buf.readBigUInt64BE(offset);
      payloadLen = Number(big);
      offset += 8;
    }

    let maskKey = null;
    if (masked) {
      if (buf.length < offset + 4) return null;
      maskKey = buf.subarray(offset, offset + 4);
      offset += 4;
    }

    if (buf.length < offset + payloadLen) return null;

    let payload = buf.subarray(offset, offset + payloadLen);
    if (masked) {
      const out = Buffer.allocUnsafe(payloadLen);
      for (let i = 0; i < payloadLen; i++) out[i] = payload[i] ^ maskKey[i & 3];
      payload = out;
    }

    this._buffer = buf.subarray(offset + payloadLen);
    return { fin, opcode, payload };
  }

  _handleFrame(frame) {
    const { fin, opcode, payload } = frame;
    switch (opcode) {
      case OP_PING:
        this._send(OP_PONG, payload);
        return;
      case OP_PONG:
        return;
      case OP_CLOSE:
        this.close();
        return;
      case OP_TEXT:
      case OP_BINARY:
        if (fin) {
          this._emitMessage(opcode, payload);
        } else {
          this._fragmentOp = opcode;
          this._fragments = [payload];
        }
        return;
      case 0x0: // continuation
        this._fragments.push(payload);
        if (fin) {
          const full = Buffer.concat(this._fragments);
          const op = this._fragmentOp;
          this._fragments = [];
          this._fragmentOp = null;
          this._emitMessage(op, full);
        }
        return;
      default:
        this.close();
    }
  }

  _emitMessage(opcode, payload) {
    if (opcode === OP_TEXT) this.emit('message', payload.toString('utf8'));
    else this.emit('binary', payload);
  }

  _send(opcode, data) {
    if (this.closed) return;
    const payload = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const len = payload.length;
    let header;
    if (len < 126) {
      header = Buffer.allocUnsafe(2);
      header[1] = len;
    } else if (len < 65536) {
      header = Buffer.allocUnsafe(4);
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.allocUnsafe(10);
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    header[0] = 0x80 | opcode; // FIN + opcode, server frames are unmasked
    try {
      this.socket.write(Buffer.concat([header, payload]));
    } catch (err) {
      this.emit('error', err);
    }
  }

  sendText(str) {
    this._send(OP_TEXT, Buffer.from(str, 'utf8'));
  }

  sendJSON(obj) {
    this.sendText(JSON.stringify(obj));
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this._send(OP_CLOSE, Buffer.alloc(0));
      this.socket.end();
    } catch {
      /* ignore */
    }
    this.emit('close');
  }

  _onClose() {
    if (this.closed) return;
    this.closed = true;
    this.emit('close');
  }
}

// Attaches a WebSocket upgrade handler to an http.Server.
function attach(server, onConnection) {
  server.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    if (req.headers['upgrade']?.toLowerCase() !== 'websocket' || !key) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }
    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey(key)}`,
      '\r\n',
    ];
    socket.write(headers.join('\r\n'));
    onConnection(new Connection(socket), req);
  });
}

module.exports = { attach, Connection };
