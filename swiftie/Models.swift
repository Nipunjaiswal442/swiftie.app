import Foundation
import SwiftUI
import Combine

enum PostCategory: String, CaseIterable, Identifiable, Codable {
    case general = "General"
    case tech = "Tech"
    case art = "Art"

    var id: String { rawValue }

    var color: Color {
        switch self {
        case .general: return .cyberSaffron
        case .tech: return .cyberBlue
        case .art: return .cyberGreen
        }
    }
}

struct User: Identifiable, Hashable {
    let id: UUID = UUID()
    let name: String
    let handle: String
    let bio: String
    var followers: Int
    var following: Int
    var isFollowing: Bool
    let avatarIcon: String
}

struct Post: Identifiable, Hashable {
    let id: UUID = UUID()
    let author: User
    let content: String
    let category: PostCategory
    var likes: Int
    var isLiked: Bool
    let timeAgo: String
}

struct NotificationItem: Identifiable, Hashable {
    let id: UUID = UUID()
    let title: String
    let message: String
    let date: Date
    let isRead: Bool
}

struct UserProfile: Hashable {
    var name: String
    var handle: String
    var bio: String
    var followers: Int
    var following: Int
    var posts: Int
}

final class DemoStore: ObservableObject {
    @Published var isGuest: Bool = false

    @Published var users: [User] = []
    @Published var posts: [Post] = []
    @Published var notifications: [NotificationItem] = []
    @Published var profile: UserProfile

    init() {
        self.profile = UserProfile(
            name: "Cyber Desi",
            handle: "@cyberdesi",
            bio: "Building the future from the streets of Neo-Delhi 🇮🇳",
            followers: 1337,
            following: 42,
            posts: 10
        )
        seed()
    }

    func seed() {
        let u1 = User(name: "Arjun Tech", handle: "@arjun_t", bio: "Hacking the mainframe", followers: 500, following: 10, isFollowing: true, avatarIcon: "person.crop.circle.badge.exclamationmark")
        let u2 = User(name: "Priya V", handle: "@priya_v", bio: "Digital artist", followers: 1200, following: 300, isFollowing: false, avatarIcon: "paintpalette.fill")
        let u3 = User(name: "Rahul Neon", handle: "@neondesi", bio: "Night city explorer", followers: 800, following: 400, isFollowing: true, avatarIcon: "bolt.horizontal.fill")

        users = [u1, u2, u3]

        posts = [
            Post(author: u1, content: "Just deployed the new mainframe update. The net is secure tonight. 🌃", category: .tech, likes: 250, isLiked: false, timeAgo: "2h ago"),
            Post(author: u2, content: "Working on some new tricolour cyberpunk UI concepts. Thoughts?", category: .art, likes: 890, isLiked: true, timeAgo: "4h ago"),
            Post(author: u3, content: "Riding through the neon streets of Mumbai. The rain makes everything glow.", category: .general, likes: 120, isLiked: false, timeAgo: "6h ago")
        ]

        notifications = [
            NotificationItem(title: "New Follower", message: "Arjun Tech started following you.", date: Date().addingTimeInterval(-3600*2), isRead: false),
            NotificationItem(title: "Post Liked", message: "Priya V liked your post.", date: Date().addingTimeInterval(-3600*5), isRead: true),
            NotificationItem(title: "System Update", message: "Welcome to Swiftie v2.0 - Cyberpunk Edition.", date: Date().addingTimeInterval(-3600*24), isRead: true)
        ]
    }

    func likePost(_ post: Post) {
        if let idx = posts.firstIndex(where: { $0.id == post.id }) {
            posts[idx].isLiked.toggle()
            posts[idx].likes += posts[idx].isLiked ? 1 : -1
        }
    }
    
    func followUser(_ user: User) {
        if let idx = users.firstIndex(where: { $0.id == user.id }) {
            users[idx].isFollowing.toggle()
            users[idx].followers += users[idx].isFollowing ? 1 : -1
        }
    }
}
