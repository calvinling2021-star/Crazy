import SwiftUI

struct ControlView: View {
    @EnvironmentObject var client: RemoteClient

    var body: some View {
        TabView {
            TerminalView()
                .tabItem { Label("Terminal", systemImage: "terminal") }

            TrackpadView()
                .tabItem { Label("Trackpad", systemImage: "cursorarrow.rays") }

            ScreenView()
                .tabItem { Label("Screen", systemImage: "display") }

            StatusView()
                .tabItem { Label("Status", systemImage: "info.circle") }
        }
    }
}

// MARK: - Terminal

struct TerminalView: View {
    @EnvironmentObject var client: RemoteClient
    @State private var command: String = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 4) {
                            ForEach(client.log) { entry in
                                Text(entry.text)
                                    .font(.system(.footnote, design: .monospaced))
                                    .foregroundStyle(entry.isError ? .red : .primary)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .textSelection(.enabled)
                                    .id(entry.id)
                            }
                        }
                        .padding(.horizontal)
                    }
                    .onChange(of: client.log.count) { _, _ in
                        if let last = client.log.last { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }

                Divider()

                HStack {
                    TextField("command", text: $command)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .font(.system(.body, design: .monospaced))
                        .onSubmit(runCommand)
                    Button("Run", action: runCommand)
                        .disabled(command.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding()
            }
            .navigationTitle("Terminal")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(role: .destructive) { client.disconnect() } label: {
                        Image(systemName: "xmark.circle")
                    }
                }
            }
        }
    }

    private func runCommand() {
        let cmd = command.trimmingCharacters(in: .whitespaces)
        guard !cmd.isEmpty else { return }
        client.runExec(cmd)
        command = ""
    }
}

// MARK: - Screen

struct ScreenView: View {
    @EnvironmentObject var client: RemoteClient

    var body: some View {
        NavigationStack {
            VStack {
                if let b64 = client.lastScreenshotBase64,
                   let data = Data(base64Encoded: b64),
                   let image = UIImage(data: data) {
                    ScrollView([.horizontal, .vertical]) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                    }
                } else if client.capabilities?.screenshot == false {
                    ContentUnavailableView(
                        "Screenshots unavailable",
                        systemImage: "display.trianglebadge.exclamationmark",
                        description: Text("The desktop agent has no screenshot tool installed.")
                    )
                } else {
                    ContentUnavailableView(
                        "No screenshot yet",
                        systemImage: "camera.viewfinder",
                        description: Text("Tap capture to grab the desktop screen.")
                    )
                }
            }
            .navigationTitle("Screen")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        client.requestScreenshot()
                    } label: {
                        Image(systemName: "camera")
                    }
                    .disabled(client.capabilities?.screenshot == false)
                }
            }
        }
    }
}

// MARK: - Status

struct StatusView: View {
    @EnvironmentObject var client: RemoteClient

    var body: some View {
        NavigationStack {
            List {
                if let caps = client.capabilities {
                    Section("Desktop") {
                        row("Hostname", caps.hostname)
                        row("Platform", caps.platform)
                    }
                    Section("Capabilities") {
                        capRow("Run commands", caps.exec)
                        capRow("Screen capture", caps.screenshot, detail: caps.screenshotTool)
                        capRow("Input control", caps.input, detail: caps.input ? caps.inputBackend : nil)
                    }
                }
                Section {
                    Button(role: .destructive) { client.disconnect() } label: {
                        Text("Disconnect")
                    }
                }
            }
            .navigationTitle("Status")
        }
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack { Text(label); Spacer(); Text(value).foregroundStyle(.secondary) }
    }

    private func capRow(_ label: String, _ enabled: Bool, detail: String? = nil) -> some View {
        HStack {
            Image(systemName: enabled ? "checkmark.circle.fill" : "xmark.circle")
                .foregroundStyle(enabled ? .green : .secondary)
            Text(label)
            Spacer()
            if let detail, enabled { Text(detail).font(.caption).foregroundStyle(.secondary) }
        }
    }
}
