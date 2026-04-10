import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://swiftie-backend.onrender.com/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('swiftie_jwt')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const exchangeFirebaseToken = (idToken: string) =>
  api.post<{ token: string; user: UserProfile }>('/auth/firebase', { idToken })

// Users
export const getMe = () => api.get<UserProfile>('/users/me')
export const updateMe = (data: Partial<UserProfile>) => api.put<UserProfile>('/users/me', data)
export const getUserByUsername = (username: string) =>
  api.get<UserProfile>(`/users/username/${username}`)
export const getUserById = (id: string) => api.get<UserProfile>(`/users/${id}`)
export const followUser = (id: string) => api.post(`/users/${id}/follow`)
export const unfollowUser = (id: string) => api.delete(`/users/${id}/follow`)
export const searchUsers = (query: string) =>
  api.get<UserProfile[]>('/users/search', { params: { q: query } })

// Posts
export const getFeed = (page = 1) =>
  api.get<{ posts: Post[]; hasMore: boolean }>('/posts/feed', { params: { page } })
export const createPost = (data: FormData) =>
  api.post<Post>('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const likePost = (id: string) => api.post(`/posts/${id}/like`)
export const unlikePost = (id: string) => api.delete(`/posts/${id}/like`)
export const getUserPosts = (userId: string) =>
  api.get<Post[]>(`/posts/user/${userId}`)

// Messages
export const getConversations = () =>
  api.get<Conversation[]>('/conversations')
export const getMessages = (conversationId: string, page = 1) =>
  api.get<{ messages: Message[]; hasMore: boolean }>(
    `/conversations/${conversationId}/messages`,
    { params: { page } }
  )
export const sendMessage = (recipientId: string, ciphertext: string) =>
  api.post<Message>('/messages', { recipientId, ciphertext })

// Types
export interface UserProfile {
  _id: string
  firebaseUid: string
  email: string
  username: string
  displayName: string
  bio?: string
  profilePhotoUrl?: string
  coverPhotoUrl?: string
  followersCount: number
  followingCount: number
  postsCount: number
  isOnline?: boolean
  lastSeen?: string
}

export interface Post {
  _id: string
  author: UserProfile
  imageUrl?: string
  caption?: string
  likesCount: number
  commentsCount: number
  likedByMe?: boolean
  createdAt: string
}

export interface Message {
  _id: string
  conversationId: string
  sender: UserProfile
  recipient: UserProfile
  ciphertext: string
  createdAt: string
  readAt?: string
}

export interface Conversation {
  _id: string
  conversationId: string
  otherUser: UserProfile
  lastMessage?: { ciphertext: string; createdAt: string }
  unreadCount: number
  updatedAt: string
}
