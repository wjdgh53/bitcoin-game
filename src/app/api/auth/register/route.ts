// API route for user registration

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth-service';
import { setCookie } from 'cookies-next';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Register user
    const result = await authService.register(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
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
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}