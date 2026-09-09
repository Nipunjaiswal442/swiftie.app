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
    // Richer profile fields
    age:               v.optional(v.number()),
    location:          v.optional(v.string()),
    pronouns:          v.optional(v.string()),
    currentRole:       v.optional(v.string()),
    interests:         v.optional(v.array(v.string())),
    // Denormalised assessment result caches (updated by completeAssessment)
    personalityResult: v.optional(v.string()), // e.g. "ENFP"
    ideologyResult:    v.optional(v.string()), // e.g. "progressive"
    occupationResult:  v.optional(v.string()), // e.g. "tech"
    // Account regulation (admin console)
    status:            v.optional(v.union(v.literal("active"), v.literal("suspended"))),
    suspendedReason:   v.optional(v.string()),
    suspendedAt:       v.optional(v.number()),
    // Appearance preferences (Settings → Appearance); mirrored in localStorage on the client
    prefs: v.optional(
      v.object({
        palette:      v.optional(v.string()),  // "tricolour" | "cyan" | "magenta" | "amber" | "mono" | "light"
        fontScale:    v.optional(v.string()),  // "small" | "medium" | "large" | "xlarge"
        fontFamily:   v.optional(v.string()),  // "cyber" | "readable" | "mono"
        reduceMotion: v.optional(v.boolean()),
      })
    ),
    profileCompletedAt: v.optional(v.number()),
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
    .index("by_post_and_user", ["postId", "userId"])
    .index("by_user", ["userId"]),

  // Comments on personal-feed posts AND community discussion posts.
  // `parentId` threads replies one level deep under a top-level comment.
  comments: defineTable({
    postId: v.union(v.id("posts"), v.id("communityPosts")),
    parentId: v.optional(v.id("comments")),
    authorId: v.id("users"),
    content: v.string(),
    likesCount: v.number(),
    repliesCount: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_parent", ["parentId"])
    .index("by_author", ["authorId"]),

  commentLikes: defineTable({
    commentId: v.id("comments"),
    userId: v.id("users"),
  })
    .index("by_comment", ["commentId"])
    .index("by_comment_and_user", ["commentId", "userId"])
    .index("by_user", ["userId"]),

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
      v.literal("occupation"),
      v.literal("custom")
    ),
    matchKey: v.optional(v.string()),
    description: v.string(),
    memberCount: v.number(),
    icon: v.string(),
    createdBy: v.optional(v.id("users")),
    isUserCreated: v.optional(v.boolean()),
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

  communityPostLikes: defineTable({
    postId: v.id("communityPosts"),
    userId: v.id("users"),
  })
    .index("by_post", ["postId"])
    .index("by_post_and_user", ["postId", "userId"])
    .index("by_user", ["userId"]),

  communityMessages: defineTable({
    communityId: v.id("communities"),
    senderId: v.id("users"),
    content: v.string(),
  })
    .index("by_community", ["communityId"])
    .index("by_sender", ["senderId"]),

  communityApplications: defineTable({
    userId:      v.id("users"),
    communityId: v.id("communities"),
    answers: v.object({
      whyJoin:        v.string(),   // textarea, 50-500 chars
      currentFit:     v.string(),   // empty string if no current match in section
      identification: v.string(),   // "Identify strongly" | "Exploring out of curiosity" | "Disagree but want to engage"
      duration:       v.string(),   // "<6 months" | "6mo-2yrs" | "2+ years" | "All my life"
      willRetake:     v.boolean(),  // true = willing to retake
    }),
    status:    v.union(v.literal("pending"), v.literal("auto-approved"), v.literal("rejected")),
    appliedAt: v.number(),
    decidedAt: v.optional(v.number()),
  })
    .index("by_user",               ["userId"])
    .index("by_user_and_community", ["userId", "communityId"])
    .index("by_status",             ["status"]),

  // ─── Complaints, feature requests, bug reports and content/user reports ────
  // Submitted from Settings → Help & Feedback, from the ⚑ Report buttons, or
  // captured by Maya when a user complains / asks for something in chat.
  feedback: defineTable({
    userId:      v.id("users"),
    type:        v.union(
      v.literal("complaint"),
      v.literal("request"),
      v.literal("bug"),
      v.literal("report"),
      v.literal("other")
    ),
    source:      v.union(v.literal("form"), v.literal("report"), v.literal("maya")),
    subject:     v.string(),
    message:     v.string(),
    targetType:  v.optional(
      v.union(v.literal("user"), v.literal("post"), v.literal("communityPost"), v.literal("comment"))
    ),
    targetId:    v.optional(v.string()),
    targetLabel: v.optional(v.string()),
    status:      v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed")),
    adminNote:   v.optional(v.string()),
    resolvedAt:  v.optional(v.number()),
  })
    .index("by_user",   ["userId"])
    .index("by_status", ["status"])
    .index("by_source", ["source"]),

  // ─── Admin console ─────────────────────────────────────────────────────────
  // Admin logs in with ADMIN_ID / ADMIN_PASSWORD (Convex env vars), gets a
  // random session token that every admin query/mutation validates.
  adminSessions: defineTable({
    token:      v.string(),
    adminId:    v.string(),
    expiresAt:  v.number(),
    lastUsedAt: v.optional(v.number()),
  }).index("by_token", ["token"]),

  // Failed-login throttle (single row, key = "admin")
  adminLoginThrottle: defineTable({
    key:         v.string(),
    failures:    v.number(),
    windowStart: v.number(),
    lockedUntil: v.optional(v.number()),
  }).index("by_key", ["key"]),

  // Notifications shown in the admin console: Maya's daily digest of
  // complaints/requests, plus instant pings for new reports and feedback.
  adminNotifications: defineTable({
    kind:        v.union(
      v.literal("daily_digest"),
      v.literal("report"),
      v.literal("feedback"),
      v.literal("system")
    ),
    title:       v.string(),
    body:        v.string(),
    readAt:      v.optional(v.number()),
    periodStart: v.optional(v.number()),
    periodEnd:   v.optional(v.number()),
    stats:       v.optional(v.any()),
    feedbackId:  v.optional(v.id("feedback")),
  }).index("by_kind", ["kind"]),

  adminAuditLog: defineTable({
    adminId:      v.string(),
    action:       v.string(),
    targetUserId: v.optional(v.id("users")),
    details:      v.optional(v.string()),
  }),
});
