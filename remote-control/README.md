# Remote Control — control a desktop from an iOS app

An iOS app that remote-controls a desktop over the local network. It can run
shell commands, move/click the mouse, type and tap keys, and capture the
desktop screen. Two parts:

- **`agent/`** — a dependency-free Node.js server that runs on the desktop you
  want to control. No `npm install`, no native modules: it uses Node built-ins
  plus OS-native CLI tools, so it runs on macOS, Linux, and Windows.
- **`ios/`** — a SwiftUI app that connects to the agent over WebSocket.

The two talk over a small JSON-over-WebSocket protocol — see [`PROTOCOL.md`](./PROTOCOL.md).

```
 iPhone (SwiftUI)  ──ws://lan-ip:8770──▶  Desktop agent (Node)  ──▶  OS input / screen / shell
```

## 1. Run the desktop agent

```bash
cd remote-control/agent
node server.js
```

On first launch it generates a **pairing token** and prints it, along with the
`ws://` URLs to use:

```
 Port:          8770
 Pairing token: 9F3A2B7C
 Connect from the iOS app using one of:
   ws://192.168.1.20:8770
```

Config is saved to `~/.remote-control/config.json`. Override via env vars:
`RC_TOKEN`, `RC_PORT`, `RC_HOST`. To disable shell exec, set `"allowExec": false`
in the config file.

### Enabling mouse/keyboard/screenshot

The agent shells out to native tools and **degrades gracefully** — if a tool is
missing, that capability is reported as unavailable (the iOS app greys it out)
but everything else keeps working. Install what you need:

| Capability   | macOS                         | Linux (X11)        | Linux (Wayland) | Windows           |
|--------------|-------------------------------|--------------------|-----------------|-------------------|
| Screenshot   | built-in (`screencapture`)    | `scrot`/`maim`     | `grim`          | built-in (PS)     |
| Mouse/Keyboard | `brew install cliclick`     | `xdotool`          | `ydotool`       | built-in (PS)     |

> macOS also requires granting the terminal **Accessibility** and **Screen
> Recording** permissions (System Settings → Privacy & Security).

## 2. Build & run the iOS app

There's no checked-in `.xcodeproj` — generate one from the source with
[XcodeGen](https://github.com/yonyz/XcodeGen):

```bash
brew install xcodegen
cd remote-control/ios
xcodegen generate
open RemoteControl.xcodeproj
```

Then in Xcode: set your signing team, pick a device/simulator, and Run.
(You can also create a new SwiftUI app project by hand and add the files under
`ios/RemoteControl/` — just keep the `Info.plist` keys for local networking.)

In the app:
1. Enter the desktop's **IP**, **port** (8770), and the **pairing token**.
2. Tap **Connect**.
3. Use the **Terminal**, **Trackpad**, **Screen**, and **Status** tabs.

## Security notes

- Connections are gated by the pairing token; a wrong token is rejected and the
  socket closed.
- Traffic is **unencrypted `ws://`** and intended for a **trusted LAN**. Do not
  expose the agent's port to the public internet. For remote use, tunnel over a
  VPN/SSH or put a TLS-terminating reverse proxy in front of it.
- `exec` runs arbitrary shell commands as the user running the agent. Disable it
  (`allowExec: false`) if you only want input/screen control.

## Layout

```
remote-control/
  agent/
    server.js            # WebSocket + HTTP server, auth, command dispatch
    config.js            # token + settings (persisted to ~/.remote-control)
    handlers/exec.js     # safe shell command execution
    lib/ws.js            # zero-dependency RFC 6455 WebSocket server
    lib/platform.js      # OS-native input / screenshot, with capability detection
  ios/
    project.yml          # XcodeGen spec
    RemoteControl/
      RemoteControlApp.swift
      Models/Protocol.swift
      Networking/RemoteClient.swift
      Views/{ConnectView,ControlView,TrackpadView}.swift
  PROTOCOL.md
```
