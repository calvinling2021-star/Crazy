import SwiftUI

struct ConnectView: View {
    @EnvironmentObject var client: RemoteClient

    @AppStorage("rc.host") private var host: String = ""
    @AppStorage("rc.port") private var port: String = "8770"
    @AppStorage("rc.token") private var token: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Desktop") {
                    TextField("Host or IP (e.g. 192.168.1.20)", text: $host)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    TextField("Port", text: $port)
                        .keyboardType(.numberPad)
                }

                Section("Pairing") {
                    TextField("Pairing token", text: $token)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                    Text("Shown in the agent's terminal when it starts.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Section {
                    Button(action: connect) {
                        HStack {
                            Spacer()
                            connectLabel
                            Spacer()
                        }
                    }
                    .disabled(!canConnect)
                }

                if case let .failed(message) = client.state {
                    Section {
                        Text(message)
                            .foregroundStyle(.red)
                            .font(.callout)
                    }
                }
            }
            .navigationTitle("Remote Control")
        }
    }

    @ViewBuilder private var connectLabel: some View {
        switch client.state {
        case .connecting, .authenticating:
            ProgressView()
        default:
            Text("Connect")
                .fontWeight(.semibold)
        }
    }

    private var canConnect: Bool {
        !host.trimmingCharacters(in: .whitespaces).isEmpty &&
        !token.trimmingCharacters(in: .whitespaces).isEmpty &&
        Int(port) != nil
    }

    private func connect() {
        let profile = ConnectionProfile(
            host: host.trimmingCharacters(in: .whitespaces),
            port: Int(port) ?? 8770,
            token: token.trimmingCharacters(in: .whitespaces)
        )
        client.connect(profile: profile)
    }
}
