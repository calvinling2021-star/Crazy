import SwiftUI

struct TrackpadView: View {
    @EnvironmentObject var client: RemoteClient

    // Cursor position is tracked locally and sent as absolute coordinates.
    // Starting guess is the middle of a typical 1440x900 desktop; the agent
    // clamps to the real screen, so exact bounds don't matter for usability.
    @State private var cursor = CGPoint(x: 720, y: 450)
    @State private var sensitivity: Double = 1.6
    @State private var keyboardText: String = ""
    @FocusState private var keyboardFocused: Bool

    private let dragThrottle = Throttle(interval: 0.03)

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                trackpad
                buttons
                keyRow
                Slider(value: $sensitivity, in: 0.5...3.0) {
                    Text("Sensitivity")
                } minimumValueLabel: {
                    Image(systemName: "tortoise")
                } maximumValueLabel: {
                    Image(systemName: "hare")
                }
                .padding(.horizontal)
            }
            .padding(.bottom)
            .navigationTitle("Trackpad")
            .overlay(alignment: .bottom) {
                // Hidden field that drives hardware keyboard / typing into desktop.
                TextField("", text: $keyboardText)
                    .focused($keyboardFocused)
                    .opacity(0)
                    .frame(height: 0)
                    .onChange(of: keyboardText) { old, new in
                        sendTypingDelta(old: old, new: new)
                    }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { keyboardFocused.toggle() } label: {
                        Image(systemName: "keyboard")
                    }
                    .disabled(client.capabilities?.input == false)
                }
            }
        }
    }

    private var trackpad: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color(.secondarySystemBackground))
            .overlay(
                Text(client.capabilities?.input == false
                     ? "Input control unavailable on desktop"
                     : "Drag to move • Tap to click • Two-finger drag to scroll")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding()
            )
            .gesture(dragGesture)
            .simultaneousGesture(tapGesture)
            .simultaneousGesture(scrollGesture)
            .padding(.horizontal)
    }

    private var buttons: some View {
        HStack(spacing: 12) {
            controlButton("Left Click") { client.click(button: "left") }
            controlButton("Right Click") { client.click(button: "right") }
            controlButton("Double") { client.click(button: "left", double: true) }
        }
        .padding(.horizontal)
    }

    private var keyRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                keyButton("⏎", "Return")
                keyButton("⌫", "BackSpace")
                keyButton("Tab", "Tab")
                keyButton("Esc", "Escape")
                keyButton("↑", "Up")
                keyButton("↓", "Down")
                keyButton("←", "Left")
                keyButton("→", "Right")
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Gestures

    private var dragGesture: some Gesture {
        DragGesture(minimumDistance: 1)
            .onChanged { value in
                let dx = value.translation.width * sensitivity
                let dy = value.translation.height * sensitivity
                cursor.x = max(0, cursor.x + dx * 0.12)
                cursor.y = max(0, cursor.y + dy * 0.12)
                dragThrottle.run {
                    client.mouseMove(x: cursor.x, y: cursor.y)
                }
            }
    }

    private var tapGesture: some Gesture {
        TapGesture().onEnded { client.click(button: "left") }
    }

    private var scrollGesture: some Gesture {
        DragGesture(minimumDistance: 5)
            .onChanged { value in
                dragThrottle.run { client.scroll(dy: -value.translation.height * 0.5) }
            }
    }

    // MARK: - Helpers

    private func controlButton(_ title: String, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color(.tertiarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .disabled(client.capabilities?.input == false)
    }

    private func keyButton(_ label: String, _ key: String) -> some View {
        Button { client.keyTap(key) } label: {
            Text(label)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color(.tertiarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .disabled(client.capabilities?.input == false)
    }

    // Translate edits in the hidden field into type/backspace events.
    private func sendTypingDelta(old: String, new: String) {
        if new.count > old.count {
            let added = String(new.dropFirst(old.count))
            client.type(added)
        } else if new.count < old.count {
            for _ in 0..<(old.count - new.count) { client.keyTap("BackSpace") }
        }
        if new.count > 64 { keyboardText = "" } // keep buffer small
    }
}

// Simple time-based throttle so rapid drag updates don't flood the socket.
final class Throttle {
    private let interval: TimeInterval
    private var last: Date = .distantPast
    init(interval: TimeInterval) { self.interval = interval }
    func run(_ block: () -> Void) {
        let now = Date()
        if now.timeIntervalSince(last) >= interval {
            last = now
            block()
        }
    }
}
