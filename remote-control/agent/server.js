#!/usr/bin/env node
'use strict';

const http = require('http');
const os = require('os');

const ws = require('./lib/ws');
const platform = require('./lib/platform');
const { execCommand } = require('./handlers/exec');
const config = require('./config');

const PROTOCOL_VERSION = 1;
const AUTH_TIMEOUT_MS = 10000;

const cfg = config.load();

const server = http.createServer((req, res) => {
  // A tiny health endpoint so you can sanity-check reachability from a browser.
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, protocol: PROTOCOL_VERSION, hostname: os.hostname() }));
    return;
  }
  res.writeHead(426, { 'content-type': 'text/plain' });
  res.end('This is the Remote Control agent. Connect via WebSocket.\n');
});

ws.attach(server, (conn, req) => {
  const peer = req.socket.remoteAddress;
  let authed = false;

  const authTimer = setTimeout(() => {
    if (!authed) {
      conn.sendJSON({ type: 'auth_error', error: 'auth timeout' });
      conn.close();
    }
  }, AUTH_TIMEOUT_MS);

  conn.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      conn.sendJSON({ type: 'error', error: 'invalid json' });
      return;
    }

    if (!authed) {
      if (msg.type === 'auth' && msg.token === cfg.token) {
        authed = true;
        clearTimeout(authTimer);
        const caps = await platform.capabilities();
        caps.exec = caps.exec && cfg.allowExec;
        conn.sendJSON({ type: 'auth_ok', protocol: PROTOCOL_VERSION, capabilities: caps });
        log(`client ${peer} authenticated`);
      } else {
        conn.sendJSON({ type: 'auth_error', error: 'invalid token' });
        conn.close();
        log(`client ${peer} rejected (bad token)`);
      }
      return;
    }

    await handle(conn, msg);
  });

  conn.on('close', () => clearTimeout(authTimer));
  conn.on('error', (err) => log(`connection error: ${err.message}`));
});

async function handle(conn, msg) {
  const id = msg.id;
  const reply = (payload) => conn.sendJSON({ type: 'result', id, ...payload });

  try {
    switch (msg.type) {
      case 'ping':
        return reply({ ok: true, data: { pong: Date.now() } });

      case 'exec':
        if (!cfg.allowExec) return reply({ ok: false, error: 'exec disabled on this agent' });
        if (typeof msg.command !== 'string' || !msg.command.trim()) {
          return reply({ ok: false, error: 'missing command' });
        }
        return reply({ ok: true, data: await execCommand(msg.command, { cwd: msg.cwd, timeoutMs: msg.timeoutMs }) });

      case 'screenshot':
        return reply({ ok: true, data: { format: 'png', base64: await platform.captureScreenshot() } });

      case 'mouse_move':
        await platform.mouseMove(Math.round(msg.x), Math.round(msg.y));
        return reply({ ok: true });

      case 'mouse_click':
        await platform.mouseClick(msg.button, !!msg.double);
        return reply({ ok: true });

      case 'scroll':
        await platform.scroll(Number(msg.dy) || 0);
        return reply({ ok: true });

      case 'type_text':
        await platform.typeText(String(msg.text ?? ''));
        return reply({ ok: true });

      case 'key_tap':
        await platform.keyTap(String(msg.key ?? ''), Array.isArray(msg.modifiers) ? msg.modifiers : []);
        return reply({ ok: true });

      case 'capabilities': {
        const caps = await platform.capabilities();
        caps.exec = caps.exec && cfg.allowExec;
        return reply({ ok: true, data: caps });
      }

      default:
        return reply({ ok: false, error: `unknown command: ${msg.type}` });
    }
  } catch (err) {
    reply({ ok: false, error: err.message });
  }
}

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function localAddresses() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

server.listen(cfg.port, cfg.host, () => {
  const addrs = localAddresses();
  console.log('========================================');
  console.log(' Remote Control agent is running');
  console.log('========================================');
  console.log(` Port:          ${cfg.port}`);
  console.log(` Pairing token: ${cfg.token}`);
  console.log(` Exec enabled:  ${cfg.allowExec}`);
  if (addrs.length) {
    console.log(' Connect from the iOS app using one of:');
    for (const a of addrs) console.log(`   ws://${a}:${cfg.port}`);
  } else {
    console.log(` Connect via:   ws://<this-machine-ip>:${cfg.port}`);
  }
  console.log('========================================');
});

process.on('SIGINT', () => {
  console.log('\nshutting down');
  server.close(() => process.exit(0));
});
