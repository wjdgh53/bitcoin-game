// Watchlist API routes

import { NextRequest, NextResponse } from 'next/server';
import { watchlistService } from '@/lib/services/watchlist-service';
import { z } from 'zod';

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

const CreateWatchlistItemSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  name: z.string().min(1).max(100),
  alertPrice: z.number().positive().optional(),
  alertType: z.enum(['above', 'below', 'both']).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional().default([])
});

const SearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).optional().default(10)
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateWatchlistItemSchema.parse(body);

    const item = await watchlistService.createWatchlistItem(user.id, validatedData);

    return NextResponse.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Watchlist item creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query) {
      // Search watchlist items
      const searchData = SearchSchema.parse({
        query,
        limit: Math.min(limit, 50)
      });

      const results = await watchlistService.searchWatchlistItems(
        user.id,
        searchData.query,
        searchData.limit
      );

      return NextResponse.json({
        success: true,
        data: results
      });
    } else {
      // Get all user watchlist items
      const items = await watchlistService.getUserWatchlistItems(user.id, limit, offset);

      return NextResponse.json({
        success: true,
        data: items
      });
    }
  } catch (error) {
    console.error('Watchlist retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve watchlist items' },
      { status: 500 }
    );
  }
}