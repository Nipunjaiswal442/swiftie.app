import SwiftUI

struct PostView: View {
    @EnvironmentObject private var store: DemoStore
    @State private var content: String = ""
    @State private var category: PostCategory = .general

    var body: some View {
        NavigationStack {
            Form {
                Section("Create a Drop") {
                    TextEditor(text: $content)
                        .frame(minHeight: 120)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                    
                    Picker("Vibe", selection: $category) {
                        ForEach(PostCategory.allCases) { c in
                            Text(c.rawValue).tag(c)
                        }
                    }
                    
                    Button(action: post) {
                        Text("Broadcast to Network")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.cyberSaffron)
                    .disabled(content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .navigationTitle("New Drop")
            .scrollContentBackground(.hidden)
            .slBackground()
        }
    }

    private func post() {
        let new = Post(
            author: User(
                name: store.profile.name,
                handle: store.profile.handle,
                bio: store.profile.bio,
                followers: store.profile.followers,
                following: store.profile.following,
                isFollowing: false,
                avatarIcon: "person.crop.circle.fill"
            ),
            content: content,
            category: category,
            likes: 0,
            isLiked: false,
            timeAgo: "Just now"
        )
        store.posts.insert(new, at: 0)
        content = ""
    }
}
