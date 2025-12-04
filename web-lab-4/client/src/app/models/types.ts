export interface User {
  id: string;
  fullName: string;
  email: string;
  birthDate?: string;
  photo?: string;
  role: 'admin' | 'user';
  status: 'pending' | 'active' | 'blocked';
}

export interface FriendEdge {
  userId: string;
  friends: string[];
}

export interface Message {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  authorName?: string;
  authorPhoto?: string;
}

export interface AuthPayload {
  email: string;
  password: string;
  fullName?: string;
  birthDate?: string;
  photo?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface FeedResponse {
  messages: Message[];
}

export interface UpdatePhotoPayload {
  photo?: string | null;
}
