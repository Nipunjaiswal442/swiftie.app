import { useState } from 'react';

// Shared data store matching iOS DemoStore
export const initialProfile = {
  name: "Nipun Jaiswal",
  handle: "@neon_nipun",
  email: "nipun@cybernet.in",
  bio: "Street Samurai. Netrunner. Building the future of Neo-Delhi.",
  followers: 4096,
  following: 128,
  posts: 42,
};

export const initialPosts = [
  {
    id: "1",
    author: {
      name: "Aaditya_Prime",
      handle: "@aadi_p",
      avatar: "https://i.pravatar.cc/150?1",
    },
    content: "Just cracked the ICE on the local food replicator. Infinite samosas unlocked.",
    category: "Tech",
    likes: 852,
    timeAgo: "2h ago",
  },
  {
    id: "2",
    author: {
      name: "Ria_Cyber",
      handle: "@ria_net",
      avatar: "https://i.pravatar.cc/150?2",
    },
    content: "Need a crew for a data extraction run on Sector 4 tonight. High Eurodollar payout.",
    category: "Gigs",
    likes: 213,
    timeAgo: "4h ago",
  },
];

export const initialUsers = [
  {
    id: "1",
    name: "Vikram_X",
    handle: "@vikram_x",
    bio: "Rogue AI enthusiast.",
    followers: 1250,
    avatar: "https://i.pravatar.cc/150?3",
    isFollowing: false,
  },
  {
    id: "2",
    name: "Cyber_Priya",
    handle: "@cpriya",
    bio: "Neon artist creating digital dreams.",
    followers: 8900,
    avatar: "https://i.pravatar.cc/150?4",
    isFollowing: true,
  },
];

export const initialNotifications = [
  {
    id: "1",
    message: "Ria_Cyber liked your drop.",
    timeAgo: "1m ago",
    icon: "Heart",
  },
  {
    id: "2",
    message: "Vikram_X started following you.",
    timeAgo: "1h ago",
    icon: "UserPlus",
  },
];
