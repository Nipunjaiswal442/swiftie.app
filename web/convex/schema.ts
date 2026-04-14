import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(), // Firebase UID from auth.subject
    email: v.string(),
    username: v.optional(v.string()),
    displayName: v.string(),
    bio: v.optional(v.string()),
    profilePhotoUrl: v.optional(v.string()),
    coverPhotoUrl: v.optional(v.string()),
    isOnline: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_username", ["username"])
    .index("by_email", ["email"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_both", ["followerId", "followingId"]),

  posts: defineTable({
    authorId: v.id("users"),
    imageUrl: v.optional(v.string()),
    caption: v.optional(v.string()),
    likesCount: v.number(),
    commentsCount: v.number(),
  }).index("by_author", ["authorId"]),

  likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
    .index("by_post", ["postId"])
    .index("by_post_and_user", ["postId", "userId"]),

  conversations: defineTable({
    participantIds: v.array(v.id("users")),
    lastMessageTime: v.optional(v.number()),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    readAt: v.optional(v.number()),
  }).index("by_conversation", ["conversationId"]),

  mayaMessages: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  }).index("by_user", ["userId"]),

  assessmentResults: defineTable({
    userId: v.id("users"),
    section: v.union(
      v.literal("personality"),
      v.literal("ideology"),
      v.literal("occupation")
    ),
    scores: v.record(v.string(), v.number()),
    matchKey: v.string(), // e.g. "INTJ", "progressive", "tech"
    completedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_section", ["userId", "section"]),

  communities: defineTable({
    slug: v.string(),
    name: v.string(),
    section: v.union(
      v.literal("personality"),
      v.literal("ideology"),
      v.literal("occupation")
    ),
    matchKey: v.string(),
    description: v.string(),
    memberCount: v.number(),
    icon: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_section", ["section"])
    .index("by_match_key", ["matchKey"]),

  communityMembers: defineTable({
    communityId: v.id("communities"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_community", ["communityId"])
    .index("by_user", ["userId"])
    .index("by_community_and_user", ["communityId", "userId"]),

  communityPosts: defineTable({
    communityId: v.id("communities"),
    authorId: v.id("users"),
    content: v.string(),
    likesCount: v.number(),
    commentsCount: v.number(),
  })
    .index("by_community", ["communityId"])
    .index("by_author", ["authorId"]),
});
