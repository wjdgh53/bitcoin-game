// Authentication related types

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  gameLevel: number;
  experience: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface SessionData {
  user: AuthUser;
  token: string;
  expiresAt: Date;
}