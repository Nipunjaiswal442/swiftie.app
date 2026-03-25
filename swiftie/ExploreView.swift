import SwiftUI

struct ExploreView: View {
    @EnvironmentObject private var store: DemoStore

    var body: some View {
        NavigationStack {
            List {
                Section(header: Text("Suggested Users").font(.title3.bold()).foregroundStyle(Color.cyberSaffron)) {
                    ForEach(store.users, id: \.id) { user in
                        CardContainer {
                            HStack(spacing: 16) {
                                Image(systemName: user.avatarIcon)
                                    .font(.title)
                                    .frame(width: 50, height: 50)
                                    .background(Circle().fill(Color.slTertiaryBG))
                                    .foregroundStyle(Color.cyberGreen)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(user.name)
                                        .font(.headline)
                                        .foregroundStyle(.white)
                                    Text(user.handle)
                                        .font(.subheadline)
                                        .foregroundStyle(Color.cyberBlue)
                                    Text("\(user.followers) Followers")
                                        .font(.caption)
                                        .foregroundStyle(.gray)
                                }
                                
                                Spacer()
                                
                                Button(action: {
                                    store.followUser(user)
                                }) {
                                    CapsuleTag(
                                        text: user.isFollowing ? "Following" : "Follow",
                                        color: user.isFollowing ? .gray : .cyberSaffron
                                    )
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                    }
                }
            }
            .listStyle(.plain)
            .navigationTitle("Explore")
            .scrollContentBackground(.hidden)
            .slBackground()
        }
    }
}
