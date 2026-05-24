import SwiftUI

@main
struct RemoteControlApp: App {
    @StateObject private var client = RemoteClient()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(client)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var client: RemoteClient

    var body: some View {
        if case .connected = client.state {
            ControlView()
        } else {
            ConnectView()
        }
    }
}
