
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: 'Admin' | 'User';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiMessage {
  message: string;
}