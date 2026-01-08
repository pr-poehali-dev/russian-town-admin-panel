const API_URL = 'https://functions.poehali.dev/583cd83c-bd8d-4227-9b54-7ab0780123a7';

interface User {
  id: number;
  username: string;
  role: string;
  faction?: string;
  custom_role?: string;
  status?: string;
  avatar?: string;
  is_banned?: boolean;
  is_muted?: boolean;
  created_at?: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  author_avatar?: string;
  created_at: string;
}

export const api = {
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_URL}?action=users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getPosts(): Promise<Post[]> {
    const response = await fetch(`${API_URL}?action=posts`);
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  },

  async login(username: string, password: string): Promise<User> {
    const response = await fetch(`${API_URL}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  async register(username: string, password: string, adminCode?: string): Promise<User> {
    const response = await fetch(`${API_URL}?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.dumps({ username, password, adminCode }),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  async createPost(userId: number, title: string, content: string): Promise<{ id: number }> {
    const response = await fetch(`${API_URL}?action=create-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, content }),
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json();
  },

  async updateRole(userId: number, role: string): Promise<void> {
    const response = await fetch(`${API_URL}?action=update-role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    if (!response.ok) throw new Error('Failed to update role');
  },

  async updateFaction(userId: number, faction: string): Promise<void> {
    const response = await fetch(`${API_URL}?action=update-faction`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, faction }),
    });
    if (!response.ok) throw new Error('Failed to update faction');
  },

  async banUser(userId: number, isBanned: boolean): Promise<void> {
    const response = await fetch(`${API_URL}?action=ban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isBanned }),
    });
    if (!response.ok) throw new Error('Failed to ban user');
  },

  async muteUser(userId: number, isMuted: boolean): Promise<void> {
    const response = await fetch(`${API_URL}?action=mute`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isMuted }),
    });
    if (!response.ok) throw new Error('Failed to mute user');
  },

  async updateAvatar(userId: number, avatar: string): Promise<void> {
    const response = await fetch(`${API_URL}?action=update-avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, avatar }),
    });
    if (!response.ok) throw new Error('Failed to update avatar');
  },

  async deleteUser(userId: number): Promise<void> {
    const response = await fetch(`${API_URL}?action=delete&userId=${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },
};
