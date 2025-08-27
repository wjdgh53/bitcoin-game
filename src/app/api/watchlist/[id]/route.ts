// Watchlist item specific API routes

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

const UpdateWatchlistItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  alertPrice: z.number().positive().optional(),
  alertType: z.enum(['above', 'below', 'both']).optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  alertTriggered: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await watchlistService.getWatchlistItemById(params.id, user.id);
    
    if (!item) {
      return NextResponse.json({ error: 'Watchlist item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Watchlist item retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve watchlist item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateWatchlistItemSchema.parse(body);

    const updatedItem = await watchlistService.updateWatchlistItem(
      params.id,
      user.id,
      validatedData
    );

    if (!updatedItem) {
      return NextResponse.json({ error: 'Watchlist item not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    console.error('Watchlist item update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update watchlist item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await watchlistService.deleteWatchlistItem(params.id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Watchlist item not found or deletion failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Watchlist item deleted successfully'
    });
  } catch (error) {
    console.error('Watchlist item deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete watchlist item' },
      { status: 500 }
    );
  }
}