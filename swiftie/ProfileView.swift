import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var store: DemoStore
    var onSignOut: () -> Void

    var myPosts: [Post] {
        store.posts.filter { $0.author.name == store.profile.name }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Header card
                    CardContainer {
                        HStack(alignment: .center, spacing: 12) {
                            ZStack {
                                Circle().fill(Color.cyberGreen.opacity(0.15)).frame(width: 72, height: 72)
                                Image(systemName: "person.crop.circle.fill").font(.title).foregroundStyle(Color.cyberGreen)
                            }
                            VStack(alignment: .leading, spacing: 6) {
                                Text(store.profile.name)
                                    .font(.title2.bold())
                                    .foregroundStyle(.white)
                                Text(store.profile.handle)
                                    .foregroundStyle(Color.cyberBlue)
                                Text(store.profile.bio)
                                    .font(.caption)
                                    .foregroundStyle(.gray)
                                    .lineLimit(2)
                            }
                            Spacer()
                        }
                    }

                    // Stats
                    HStack(spacing: 12) {
                        StatPill(title: "Followers", value: "\(store.profile.followers)", systemImage: "person.2.fill")
                        StatPill(title: "Following", value: "\(store.profile.following)", systemImage: "person.fill.viewfinder")
                        StatPill(title: "Posts", value: "\(store.profile.posts)", systemImage: "square.text.square.fill")
                    }

                    // Actions
                    CardContainer {
                        VStack(alignment: .leading, spacing: 12) {
                            Button(role: .destructive) { onSignOut() } label: {
                                HStack { 
                                    Label("Disconnect from Network", systemImage: "power")
                                        .foregroundStyle(.red)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundStyle(.gray)
                                }
                            }
                        }
                    }

                    // My Drops
                    VStack(alignment: .leading, spacing: 8) {
                        Text("My Drops")
                            .font(.headline)
                            .foregroundStyle(.gray)
                        
                        if myPosts.isEmpty {
                            Text("No drops yet.")
                                .foregroundStyle(.gray)
                                .font(.caption)
                                .padding(.top, 8)
                        } else {
                            ForEach(myPosts) { post in
                                PostRow(post: post)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Profile")
            .scrollContentBackground(.hidden)
            .slBackground()
        }
    }
}

