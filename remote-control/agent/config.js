'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.remote-control');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function load() {
  let saved = {};
  try {
    saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    /* first run */
  }

  // A pairing token gates every connection. Precedence: env > saved > generated.
  let token = process.env.RC_TOKEN || saved.token;
  let generated = false;
  if (!token) {
    token = crypto.randomBytes(4).toString('hex').toUpperCase(); // short, typeable
    generated = true;
  }

  const config = {
    host: process.env.RC_HOST || saved.host || '0.0.0.0',
    port: Number(process.env.RC_PORT || saved.port || 8770),
    token,
    allowExec: saved.allowExec !== false, // on unless explicitly disabled
  };

  if (generated) save(config);
  return config;
}

function save(config) {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify({ host: config.host, port: config.port, token: config.token, allowExec: config.allowExec }, null, 2),
    );
  } catch (err) {
    console.warn('could not persist config:', err.message);
  }
}

module.exports = { load, save, CONFIG_FILE };
