import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: DemoStore
    @State private var selectedCategory: PostCategory? = nil

    var filteredPosts: [Post] {
        store.posts.filter { post in
            selectedCategory == nil || post.category == selectedCategory!
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Namaste, ")
                                .font(.title3)
                                .foregroundStyle(.gray)
                            + Text(store.profile.name).bold()
                                .font(.title2)
                                .foregroundStyle(Color.cyberSaffron)
                        }
                        Spacer()
                        Image(systemName: "bell.badge.fill")
                            .foregroundStyle(Color.cyberSaffron)
                            .imageScale(.large)
                            .padding(10)
                            .background(Circle().fill(Color.slSecondaryBG))
                    }
                    .padding(.horizontal)

                    // Category filters
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            Button(action: { selectedCategory = nil }) {
                                CapsuleTag(text: "All", color: selectedCategory == nil ? .cyberSaffron : .gray)
                            }
                            ForEach(PostCategory.allCases) { cat in
                                Button(action: { selectedCategory = cat }) {
                                    CapsuleTag(text: cat.rawValue, color: selectedCategory == cat ? cat.color : .gray)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }

                    // Feed
                    LazyVStack(spacing: 16) {
                        ForEach(filteredPosts, id: \.id) { post in
                            PostRow(post: post)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("CyberFeed")
            .navigationBarHidden(true)
            .slBackground()
        }
    }
}

struct PostRow: View {
    var post: Post
    @EnvironmentObject private var store: DemoStore

    var body: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: post.author.avatarIcon)
                        .font(.title2)
                        .frame(width: 42, height: 42)
                        .background(Circle().fill(Color.slTertiaryBG))
                        .foregroundStyle(Color.cyberBlue)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(post.author.name)
                                .font(.headline)
                                .foregroundStyle(.white)
                            Spacer()
                            Text(post.timeAgo)
                                .font(.caption)
                                .foregroundStyle(.gray)
                        }
                        Text(post.author.handle)
                            .font(.caption)
                            .foregroundStyle(.cyberSaffron)
                    }
                }
                
                Text(post.content)
                    .font(.body)
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.leading)
                    .lineLimit(nil)
                
                HStack {
                    CapsuleTag(text: post.category.rawValue, color: post.category.color)
                    Spacer()
                    Button(action: {
                        store.likePost(post)
                    }) {
                        HStack(spacing: 4) {
                            Image(systemName: post.isLiked ? "heart.fill" : "heart")
                                .foregroundStyle(post.isLiked ? Color.cyberGreen : .gray)
                            Text("\(post.likes)")
                                .font(.caption.bold())
                                .foregroundStyle(post.isLiked ? Color.cyberGreen : .gray)
                        }
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
    }
}
