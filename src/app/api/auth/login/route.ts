// API route for user login

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Login user
    const result = await authService.login(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user
    });

    // Set JWT token as httpOnly cookie
    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}