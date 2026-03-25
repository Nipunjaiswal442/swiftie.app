import SwiftUI

struct ContentView: View {
    @StateObject private var store = DemoStore()
    @State private var selectedTab: Int = 0
    @State private var isLoggedIn: Bool = true // Set to false to start at login

    var body: some View {
        Group {
            if isLoggedIn {
                TabView(selection: $selectedTab) {
                    HomeView()
                        .tabItem { Label("Feed", systemImage: "house.fill") }
                        .tag(0)

                    ExploreView()
                        .tabItem { Label("Explore", systemImage: "magnifyingglass") }
                        .tag(1)

                    PostView()
                        .tabItem { Label("Drop", systemImage: "plus.app.fill") }
                        .tag(2)

                    NotificationsView()
                        .tabItem { Label("Activity", systemImage: "bell.fill") }
                        .tag(3)

                    ProfileView(onSignOut: { isLoggedIn = false })
                        .tabItem { Label("Profile", systemImage: "person.crop.circle") }
                        .tag(4)
                }
                .tint(Color.cyberSaffron)
                .environmentObject(store)
                .preferredColorScheme(.dark)
            } else {
                LoginView(
                    onSignIn: { isLoggedIn = true },
                    onContinueAsGuest: {
                        store.isGuest = true
                        isLoggedIn = true
                    }
                )
            }
        }
    }
}

#Preview {
    ContentView()
}
