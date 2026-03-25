import SwiftUI

struct UserProfileDetailView: View {
    @EnvironmentObject private var store: DemoStore
    let user: User

    var userPosts: [Post] {
        store.posts.filter { $0.author.id == user.id }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Profile Header
                Image(systemName: user.avatarIcon)
                    .font(.system(size: 80))
                    .foregroundStyle(Color.cyberGreen)
                    .frame(width: 120, height: 120)
                    .background(Circle().fill(Color.slTertiaryBG))
                    .padding(.top, 20)

                VStack(spacing: 8) {
                    Text(user.name)
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                    Text(user.handle)
                        .font(.subheadline)
                        .foregroundStyle(Color.cyberBlue)
                    
                    Text(user.bio)
                        .font(.body)
                        .foregroundStyle(.gray)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                HStack(spacing: 40) {
                    VStack {
                        Text("\(user.followers)")
                            .font(.headline)
                            .foregroundStyle(.white)
                        Text("Followers")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    VStack {
                        Text("\(user.following)")
                            .font(.headline)
                            .foregroundStyle(.white)
                        Text("Following")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                }

                Button(action: {
                    store.followUser(user)
                }) {
                    Text(user.isFollowing ? "Following" : "Follow")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(user.isFollowing ? Color.gray.opacity(0.3) : Color.cyberSaffron)
                        .foregroundStyle(user.isFollowing ? .white : .black)
                        .cornerRadius(12)
                }
                .padding(.horizontal)

                Divider().background(Color.gray.opacity(0.3))

                // User Posts
                LazyVStack(spacing: 16) {
                    ForEach(userPosts, id: \.id) { post in
                        PostRow(post: post)
                    }
                }
                .padding(.horizontal)
            }
        }
        .navigationTitle(user.handle)
        .navigationBarTitleDisplayMode(.inline)
        .scrollContentBackground(.hidden)
        .slBackground()
    }
}
