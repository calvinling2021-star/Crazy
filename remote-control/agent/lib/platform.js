'use strict';

// Cross-platform desktop control via OS-native CLI tools.
// Each capability degrades gracefully: if the underlying tool is missing,
// the capability is reported as unavailable instead of crashing the agent.

const os = require('os');
const { execFile } = require('child_process');

const PLATFORM = os.platform(); // 'darwin' | 'linux' | 'win32'

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 64 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function which(bin) {
  return new Promise((resolve) => {
    const finder = PLATFORM === 'win32' ? 'where' : 'which';
    execFile(finder, [bin], (err, stdout) => {
      resolve(!err && stdout.trim().length > 0 ? stdout.trim().split(/\r?\n/)[0] : null);
    });
  });
}

// ---- screenshots -----------------------------------------------------------

async function screenshotTool() {
  if (PLATFORM === 'darwin') return { bin: 'screencapture', kind: 'mac' };
  if (PLATFORM === 'win32') return { bin: null, kind: 'win-ps' }; // PowerShell, always present
  // linux: try a few common tools in priority order
  for (const bin of ['grim', 'scrot', 'maim', 'import']) {
    if (await which(bin)) return { bin, kind: bin };
  }
  return null;
}

async function captureScreenshot() {
  const tool = await screenshotTool();
  if (!tool) throw new Error('no screenshot tool available');
  const tmp = `${os.tmpdir()}/rc-shot-${Date.now()}.png`;

  switch (tool.kind) {
    case 'mac':
      await run('screencapture', ['-x', '-t', 'png', tmp]);
      break;
    case 'scrot':
      await run('scrot', ['-o', tmp]);
      break;
    case 'maim':
      await run('maim', [tmp]);
      break;
    case 'grim':
      await run('grim', [tmp]);
      break;
    case 'import':
      await run('import', ['-window', 'root', tmp]);
      break;
    case 'win-ps':
      await run('powershell', ['-NoProfile', '-Command', winScreenshotScript(tmp)]);
      break;
    default:
      throw new Error('unsupported screenshot tool');
  }

  const fs = require('fs/promises');
  const buf = await fs.readFile(tmp);
  fs.unlink(tmp).catch(() => {});
  return buf.toString('base64');
}

function winScreenshotScript(outPath) {
  return [
    'Add-Type -AssemblyName System.Windows.Forms,System.Drawing;',
    '$b=[System.Windows.Forms.SystemInformation]::VirtualScreen;',
    '$bmp=New-Object System.Drawing.Bitmap($b.Width,$b.Height);',
    '$g=[System.Drawing.Graphics]::FromImage($bmp);',
    '$g.CopyFromScreen($b.Left,$b.Top,0,0,$bmp.Size);',
    `$bmp.Save('${outPath}',[System.Drawing.Imaging.ImageFormat]::Png);`,
  ].join('');
}

// ---- input injection -------------------------------------------------------

let inputBackend = null; // resolved lazily

async function resolveInputBackend() {
  if (inputBackend !== null) return inputBackend;
  if (PLATFORM === 'darwin') {
    inputBackend = (await which('cliclick')) ? 'cliclick' : 'none';
  } else if (PLATFORM === 'linux') {
    if (await which('ydotool')) inputBackend = 'ydotool';
    else if (await which('xdotool')) inputBackend = 'xdotool';
    else inputBackend = 'none';
  } else if (PLATFORM === 'win32') {
    inputBackend = 'win-ps';
  } else {
    inputBackend = 'none';
  }
  return inputBackend;
}

async function mouseMove(x, y) {
  const backend = await resolveInputBackend();
  switch (backend) {
    case 'cliclick':
      return run('cliclick', [`m:${x},${y}`]);
    case 'xdotool':
      return run('xdotool', ['mousemove', String(x), String(y)]);
    case 'ydotool':
      return run('ydotool', ['mousemove', '--absolute', '-x', String(x), '-y', String(y)]);
    case 'win-ps':
      return run('powershell', ['-NoProfile', '-Command',
        `Add-Type -AssemblyName System.Windows.Forms;[System.Windows.Forms.Cursor]::Position=New-Object System.Drawing.Point(${x},${y})`]);
    default:
      throw new Error('input control not available (install cliclick / xdotool / ydotool)');
  }
}

async function mouseClick(button = 'left', double = false) {
  const backend = await resolveInputBackend();
  const b = button === 'right' ? 'right' : button === 'middle' ? 'middle' : 'left';
  switch (backend) {
    case 'cliclick':
      return run('cliclick', [double ? `dc:.` : (b === 'right' ? 'rc:.' : 'c:.')]);
    case 'xdotool': {
      const code = b === 'right' ? '3' : b === 'middle' ? '2' : '1';
      const args = ['click'];
      if (double) args.push('--repeat', '2');
      args.push(code);
      return run('xdotool', args);
    }
    case 'ydotool': {
      const code = b === 'right' ? '0xC1' : '0xC0';
      return run('ydotool', ['click', code]);
    }
    case 'win-ps':
      return run('powershell', ['-NoProfile', '-Command', winClickScript(b, double)]);
    default:
      throw new Error('input control not available');
  }
}

async function scroll(dy) {
  const backend = await resolveInputBackend();
  const clicks = Math.max(1, Math.abs(Math.round(dy / 20)));
  const up = dy < 0;
  switch (backend) {
    case 'xdotool':
      return run('xdotool', ['click', '--repeat', String(clicks), up ? '4' : '5']);
    case 'ydotool':
      return run('ydotool', ['mousewheel', up ? String(clicks) : String(-clicks)]);
    case 'cliclick':
      return run('cliclick', [`w:${up ? '+' : '-'}${clicks}`]);
    default:
      throw new Error('scroll not available');
  }
}

async function typeText(text) {
  const backend = await resolveInputBackend();
  switch (backend) {
    case 'cliclick':
      return run('cliclick', [`t:${text}`]);
    case 'xdotool':
      return run('xdotool', ['type', '--', text]);
    case 'ydotool':
      return run('ydotool', ['type', '--', text]);
    case 'win-ps':
      return run('powershell', ['-NoProfile', '-Command',
        `Add-Type -AssemblyName System.Windows.Forms;[System.Windows.Forms.SendKeys]::SendWait([System.Text.RegularExpressions.Regex]::Escape('${text.replace(/'/g, "''")}'))`]);
    default:
      throw new Error('keyboard control not available');
  }
}

async function keyTap(key, modifiers = []) {
  const backend = await resolveInputBackend();
  switch (backend) {
    case 'xdotool': {
      const combo = [...modifiers, key].join('+');
      return run('xdotool', ['key', combo]);
    }
    case 'ydotool':
      return run('ydotool', ['key', key]);
    case 'cliclick':
      return run('cliclick', [`kp:${key}`]);
    default:
      throw new Error('keyboard control not available');
  }
}

async function capabilities() {
  const shot = await screenshotTool();
  const input = await resolveInputBackend();
  return {
    platform: PLATFORM,
    hostname: os.hostname(),
    exec: true,
    screenshot: !!shot,
    screenshotTool: shot ? shot.kind : null,
    input: input !== 'none',
    inputBackend: input,
  };
}

function winClickScript(button, double) {
  const down = button === 'right' ? '0x0008' : '0x0002';
  const up = button === 'right' ? '0x0010' : '0x0004';
  const once = `[RC.M]::mouse_event(${down},0,0,0,0);[RC.M]::mouse_event(${up},0,0,0,0);`;
  return [
    'Add-Type -Namespace RC -Name M -MemberDefinition \'[DllImport("user32.dll")] public static extern void mouse_event(uint f,uint x,uint y,uint d,int e);\';',
    double ? once + once : once,
  ].join('');
}

module.exports = {
  PLATFORM,
  run,
  which,
  captureScreenshot,
  mouseMove,
  mouseClick,
  scroll,
  typeText,
  keyTap,
  capabilities,
};
