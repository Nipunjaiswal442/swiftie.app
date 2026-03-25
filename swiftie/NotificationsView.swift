import SwiftUI

struct NotificationsView: View {
    @EnvironmentObject private var store: DemoStore

    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("Recent Activity").font(.title3.bold()).foregroundStyle(Color.cyberSaffron)) {
                    ForEach(store.notifications, id: \.id) { req in
                        CardContainer {
                            HStack(alignment: .top, spacing: 16) {
                                Image(systemName: req.isRead ? "bell" : "bell.badge.fill")
                                    .font(.title2)
                                    .foregroundStyle(req.isRead ? .gray : Color.cyberGreen)
                                    .frame(width: 40, height: 40)
                                    .background(Circle().fill(Color.slTertiaryBG))
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(req.title)
                                            .font(.headline)
                                            .foregroundStyle(req.isRead ? .gray : .white)
                                        Spacer()
                                        Text(req.date, style: .time)
                                            .font(.caption)
                                            .foregroundStyle(.gray)
                                    }
                                    
                                    Text(req.message)
                                        .font(.subheadline)
                                        .foregroundStyle(req.isRead ? .gray : Color.cyberSaffron.opacity(0.8))
                                }
                            }
                        }
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                    }
                }
            }
            .listStyle(.plain)
            .navigationTitle("Notifications")
            .scrollContentBackground(.hidden)
            .slBackground()
        }
    }
}
