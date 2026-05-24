import Foundation
import Combine

@MainActor
final class RemoteClient: NSObject, ObservableObject {

    enum State: Equatable {
        case disconnected
        case connecting
        case authenticating
        case connected
        case failed(String)
    }

    @Published private(set) var state: State = .disconnected
    @Published private(set) var capabilities: Capabilities?
    @Published private(set) var lastScreenshotBase64: String?
    @Published var log: [LogEntry] = []

    struct LogEntry: Identifiable {
        let id = UUID()
        let date = Date()
        let text: String
        let isError: Bool
    }

    private var task: URLSessionWebSocketTask?
    private var session: URLSession!
    private var token: String = ""
    private var pendingExec: [String: (ExecResult) -> Void] = [:]

    override init() {
        super.init()
        session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
    }

    func connect(profile: ConnectionProfile) {
        guard let url = profile.url else {
            state = .failed("Invalid host/port")
            return
        }
        disconnect()
        token = profile.token
        state = .connecting
        let t = session.webSocketTask(with: url)
        task = t
        t.resume()
        receiveLoop()
        // Send auth as soon as the socket opens.
        send(.auth(token: token))
        state = .authenticating
    }

    func disconnect() {
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        if state != .disconnected { state = .disconnected }
        capabilities = nil
    }

    // MARK: - Sending

    func send(_ command: Command) {
        guard let task else { return }
        task.send(.data(command.jsonData())) { [weak self] error in
            if let error {
                Task { @MainActor in self?.appendLog("send failed: \(error.localizedDescription)", error: true) }
            }
        }
    }

    func runExec(_ command: String, cwd: String? = nil, completion: ((ExecResult) -> Void)? = nil) {
        let id = UUID().uuidString
        if let completion { pendingExec[id] = completion }
        appendLog("$ \(command)", error: false)
        send(.exec(id: id, command: command, cwd: cwd))
    }

    func requestScreenshot() {
        send(.screenshot(id: UUID().uuidString))
    }

    func mouseMove(x: Double, y: Double) { send(.mouseMove(id: UUID().uuidString, x: x, y: y)) }
    func click(button: String = "left", double: Bool = false) {
        send(.mouseClick(id: UUID().uuidString, button: button, double: double))
    }
    func scroll(dy: Double) { send(.scroll(id: UUID().uuidString, dy: dy)) }
    func type(_ text: String) { send(.typeText(id: UUID().uuidString, text: text)) }
    func keyTap(_ key: String, modifiers: [String] = []) {
        send(.keyTap(id: UUID().uuidString, key: key, modifiers: modifiers))
    }

    // MARK: - Receiving

    private func receiveLoop() {
        task?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case let .success(message):
                Task { @MainActor in self.handle(message) }
                Task { @MainActor in self.receiveLoop() }
            case let .failure(error):
                Task { @MainActor in
                    if case .connected = self.state {} // keep last error context
                    self.state = .failed(error.localizedDescription)
                    self.appendLog("connection closed: \(error.localizedDescription)", error: true)
                }
            }
        }
    }

    private func handle(_ message: URLSessionWebSocketTask.Message) {
        let data: Data
        switch message {
        case let .data(d): data = d
        case let .string(s): data = Data(s.utf8)
        @unknown default: return
        }
        guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = obj["type"] as? String else { return }

        switch type {
        case "auth_ok":
            state = .connected
            if let capsObj = obj["capabilities"],
               let capsData = try? JSONSerialization.data(withJSONObject: capsObj) {
                capabilities = try? JSONDecoder().decode(Capabilities.self, from: capsData)
            }
            appendLog("connected to \(capabilities?.hostname ?? "agent")", error: false)

        case "auth_error":
            state = .failed("Auth failed: \(obj["error"] as? String ?? "invalid token")")

        case "result":
            handleResult(obj, data: data)

        case "error":
            appendLog("agent error: \(obj["error"] as? String ?? "unknown")", error: true)

        default:
            break
        }
    }

    private func handleResult(_ obj: [String: Any], data: Data) {
        let id = obj["id"] as? String

        // Screenshot result
        if let inner = obj["data"] as? [String: Any], let b64 = inner["base64"] as? String {
            lastScreenshotBase64 = b64
            return
        }

        // Exec result
        if let id, let handler = pendingExec[id],
           let inner = obj["data"] as? [String: Any],
           let innerData = try? JSONSerialization.data(withJSONObject: inner),
           let execResult = try? JSONDecoder().decode(ExecResult.self, from: innerData) {
            pendingExec[id] = nil
            handler(execResult)
            if let out = execResult.stdout, !out.isEmpty { appendLog(out.trimmingCharacters(in: .whitespacesAndNewlines), error: false) }
            if let err = execResult.stderr, !err.isEmpty { appendLog(err.trimmingCharacters(in: .whitespacesAndNewlines), error: true) }
            return
        }

        if let ok = obj["ok"] as? Bool, !ok {
            appendLog("error: \(obj["error"] as? String ?? "command failed")", error: true)
        }
    }

    private func appendLog(_ text: String, error: Bool) {
        log.append(LogEntry(text: text, isError: error))
        if log.count > 500 { log.removeFirst(log.count - 500) }
    }
}

extension RemoteClient: URLSessionWebSocketDelegate {
    nonisolated func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask,
                                didOpenWithProtocol protocol: String?) {
        // socket open; auth was already queued in connect()
    }

    nonisolated func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask,
                                didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
                                reason: Data?) {
        Task { @MainActor in
            if self.state != .disconnected { self.state = .disconnected }
        }
    }
}
