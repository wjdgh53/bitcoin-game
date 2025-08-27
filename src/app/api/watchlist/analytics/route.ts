// Watchlist analytics API route

import { NextRequest, NextResponse } from 'next/server';
import { watchlistService } from '@/lib/services/watchlist-service';

// Simple authentication mock for testing
function validateAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return {
    id: 'demo-user-123',
    email: 'demo@example.com'
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await watchlistService.getWatchlistAnalytics(user.id);

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Watchlist analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve watchlist analytics' },
      { status: 500 }
    );
  }
}