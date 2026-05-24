# Remote Control wire protocol (v1)

Transport: **WebSocket** (text frames containing JSON). The agent also serves
`GET /health` over plain HTTP for reachability checks.

Every request from the app carries a unique `id`; the agent echoes it back in
the matching `result` so replies can be correlated.

## Handshake

1. App opens the WebSocket to `ws://<host>:<port>`.
2. App sends auth **first**:
   ```json
   { "type": "auth", "token": "AB12CD34" }
   ```
3. Agent replies:
   ```json
   { "type": "auth_ok", "protocol": 1, "capabilities": { ... } }
   ```
   or
   ```json
   { "type": "auth_error", "error": "invalid token" }
   ```
   then closes. Auth must complete within 10s or the socket is dropped.

`capabilities`:
```json
{
  "platform": "darwin",
  "hostname": "studio.local",
  "exec": true,
  "screenshot": true,
  "screenshotTool": "mac",
  "input": true,
  "inputBackend": "cliclick"
}
```

## Commands (app → agent)

| type          | fields                                  | effect                              |
|---------------|-----------------------------------------|-------------------------------------|
| `ping`        | —                                       | liveness check                      |
| `exec`        | `command`, optional `cwd`, `timeoutMs`  | run a shell command                 |
| `screenshot`  | —                                       | capture the desktop screen (PNG)    |
| `mouse_move`  | `x`, `y`                                | move cursor to absolute coords      |
| `mouse_click` | `button` (`left`/`right`/`middle`), `double` | click                          |
| `scroll`      | `dy`                                    | scroll vertically                   |
| `type_text`   | `text`                                  | type a string                       |
| `key_tap`     | `key`, `modifiers` (array)              | tap a key with modifiers            |
| `capabilities`| —                                       | re-fetch capabilities               |

## Results (agent → app)

```json
{ "type": "result", "id": "<id>", "ok": true, "data": { ... } }
{ "type": "result", "id": "<id>", "ok": false, "error": "input control not available" }
```

`exec` data: `{ "ok": true, "exitCode": 0, "stdout": "...", "stderr": "...", "truncated": false }`
`screenshot` data: `{ "format": "png", "base64": "<...>" }`
