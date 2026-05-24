import Foundation

// Wire protocol shared with the desktop agent (see agent/server.js, PROTOCOL.md).
// Protocol version 1.

enum RCProtocol {
    static let version = 1
}

// Capabilities reported by the agent after a successful auth.
struct Capabilities: Decodable, Equatable {
    var platform: String
    var hostname: String
    var exec: Bool
    var screenshot: Bool
    var screenshotTool: String?
    var input: Bool
    var inputBackend: String
}

// Result payload for an exec command.
struct ExecResult: Decodable {
    var ok: Bool
    var exitCode: Int?
    var stdout: String?
    var stderr: String?
    var truncated: Bool?
    var error: String?
}

// Outbound command builders. The agent matches on `type` and correlates
// replies by `id`, so every request carries a unique id.
enum Command {
    case auth(token: String)
    case ping
    case exec(id: String, command: String, cwd: String?)
    case screenshot(id: String)
    case mouseMove(id: String, x: Double, y: Double)
    case mouseClick(id: String, button: String, double: Bool)
    case scroll(id: String, dy: Double)
    case typeText(id: String, text: String)
    case keyTap(id: String, key: String, modifiers: [String])
    case capabilities(id: String)

    func jsonData() -> Data {
        var dict: [String: Any]
        switch self {
        case let .auth(token):
            dict = ["type": "auth", "token": token]
        case .ping:
            dict = ["type": "ping"]
        case let .exec(id, command, cwd):
            dict = ["type": "exec", "id": id, "command": command]
            if let cwd { dict["cwd"] = cwd }
        case let .screenshot(id):
            dict = ["type": "screenshot", "id": id]
        case let .mouseMove(id, x, y):
            dict = ["type": "mouse_move", "id": id, "x": x, "y": y]
        case let .mouseClick(id, button, double):
            dict = ["type": "mouse_click", "id": id, "button": button, "double": double]
        case let .scroll(id, dy):
            dict = ["type": "scroll", "id": id, "dy": dy]
        case let .typeText(id, text):
            dict = ["type": "type_text", "id": id, "text": text]
        case let .keyTap(id, key, modifiers):
            dict = ["type": "key_tap", "id": id, "key": key, "modifiers": modifiers]
        case let .capabilities(id):
            dict = ["type": "capabilities", "id": id]
        }
        return (try? JSONSerialization.data(withJSONObject: dict)) ?? Data()
    }
}

// Saved connection profile, persisted in UserDefaults.
struct ConnectionProfile: Codable, Equatable {
    var host: String
    var port: Int
    var token: String

    var url: URL? {
        URL(string: "ws://\(host):\(port)")
    }
}
