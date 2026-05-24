'use strict';

const { spawn } = require('child_process');
const os = require('os');

// Runs a shell command and returns stdout/stderr/exit code.
// Output is capped so a runaway command can't exhaust memory or flood the socket.
function execCommand(command, { cwd, timeoutMs = 30000, maxOutput = 1024 * 1024 } = {}) {
  return new Promise((resolve) => {
    const shell = os.platform() === 'win32' ? 'cmd' : '/bin/sh';
    const shellArgs = os.platform() === 'win32' ? ['/c', command] : ['-c', command];

    const child = spawn(shell, shellArgs, { cwd: cwd || os.homedir() });

    let stdout = '';
    let stderr = '';
    let truncated = false;
    let settled = false;

    const append = (target, chunk) => {
      const remaining = maxOutput - (stdout.length + stderr.length);
      if (remaining <= 0) {
        truncated = true;
        return target;
      }
      return target + chunk.toString('utf8').slice(0, remaining);
    };

    child.stdout.on('data', (c) => { stdout = append(stdout, c); });
    child.stderr.on('data', (c) => { stderr = append(stderr, c); });

    const timer = setTimeout(() => {
      if (settled) return;
      child.kill('SIGKILL');
      finish({ ok: false, error: `timed out after ${timeoutMs}ms`, stdout, stderr, truncated });
    }, timeoutMs);

    function finish(payload) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(payload);
    }

    child.on('error', (err) => finish({ ok: false, error: err.message }));
    child.on('close', (code) => finish({ ok: true, exitCode: code, stdout, stderr, truncated }));
  });
}

module.exports = { execCommand };
