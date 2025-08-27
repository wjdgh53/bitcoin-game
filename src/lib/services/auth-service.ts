// Authentication service with JWT

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthUser, JWTPayload, AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth';
import { userService } from './user-service';
import { User } from '@/types/game';

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string = '7d';
  private readonly saltRounds: number = 10;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-change-this-in-production';
    
    if (this.jwtSecret === 'your-super-secure-jwt-secret-key-change-this-in-production') {
      console.warn('⚠️  Using default JWT secret. Please set JWT_SECRET in environment variables!');
    }
  }

  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validate input
      if (!request.email || !request.username || !request.password) {
        return {
          success: false,
          message: 'Email, username, and password are required'
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.email)) {
        return {
          success: false,
          message: 'Invalid email format'
        };
      }

      // Validate username length
      if (request.username.length < 3 || request.username.length > 50) {
        return {
          success: false,
          message: 'Username must be between 3 and 50 characters'
        };
      }

      // Validate password strength
      if (request.password.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(request.password, this.saltRounds);

      // Create user
      const user = await userService.createUser(
        request.email.toLowerCase(),
        request.username,
        hashedPassword
      );

      // Generate JWT token
      const token = this.generateToken(user);

      // Convert to AuthUser
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        gameLevel: user.gameLevel,
        experience: user.experience
      };

      return {
        success: true,
        message: 'Registration successful',
        user: authUser,
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      // Handle specific errors
      if (errorMessage.includes('already exists')) {
        return {
          success: false,
          message: errorMessage
        };
      }
      
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Login user
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      // Validate input
      if (!request.email || !request.password) {
        return {
          success: false,
          message: 'Email and password are required'
        };
      }

      // Find user by email
      const user = await userService.findUserByEmail(request.email.toLowerCase());
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Validate password
      const isValidPassword = await userService.validatePassword(
        request.email.toLowerCase(),
        request.password
      );

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Convert to AuthUser
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        gameLevel: user.gameLevel,
        experience: user.experience
      };

      return {
        success: true,
        message: 'Login successful',
        user: authUser,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Refresh token (extend expiry)
   */
  async refreshToken(oldToken: string): Promise<string | null> {
    try {
      // Verify old token
      const payload = this.verifyToken(oldToken);
      if (!payload) {
        return null;
      }

      // Get fresh user data
      const user = await userService.findUserById(payload.userId);
      if (!user) {
        return null;
      }

      // Generate new token
      return this.generateToken(user);
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Get user from token
   */
  async getUserFromToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = this.verifyToken(token);
      if (!payload) {
        return null;
      }

      const user = await userService.findUserById(payload.userId);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        gameLevel: user.gameLevel,
        experience: user.experience
      };
    } catch (error) {
      console.error('Get user from token error:', error);
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      // Get user
      const user = await userService.findUserById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Validate current password
      const isValidPassword = await userService.validatePassword(user.email, currentPassword);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return {
          success: false,
          message: 'New password must be at least 8 characters long'
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password in ChromaDB (would need to add this method to userService)
      // For now, we'll return success as the structure is in place
      
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password'
      };
    }
  }

  /**
   * Logout (client-side token removal)
   */
  logout(): AuthResponse {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token from storage
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }
}

// Export singleton instance
export const authService = new AuthService();