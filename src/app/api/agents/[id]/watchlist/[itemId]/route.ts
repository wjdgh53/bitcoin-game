import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma-client';

// Validation schema for watchlist item updates
const watchlistItemUpdateSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase().optional(),
  name: z.string().min(1).max(100).optional(),
  category: z.enum(['장기투자', '단기트레이딩', '모멘텀', '가치투자', '성장주', '배당주', '투기적투자', '안전자산', '대체투자']).optional(),
  reason: z.string().min(1).max(500).optional(),
  agentView: z.string().min(1).max(500).optional(),
  alertPrice: z.number().positive().nullable().optional(),
  alertType: z.enum(['above', 'below', 'both']).nullable().optional(),
  isActive: z.boolean().optional(),
});

// GET: Get a specific watchlist item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: agentId, itemId } = await params;

    // Find the watchlist item
    const watchlistItem = await prisma.agentWatchlistItem.findFirst({
      where: {
        id: itemId,
        agentId: agentId
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    if (!watchlistItem) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      watchlistItem
    });

  } catch (error) {
    console.error('Failed to get watchlist item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update a watchlist item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: agentId, itemId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = watchlistItemUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid data', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if watchlist item exists and belongs to the agent
    const existingItem = await prisma.agentWatchlistItem.findFirst({
      where: {
        id: itemId,
        agentId: agentId
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    // If updating symbol, check for duplicates
    if (data.symbol && data.symbol !== existingItem.symbol) {
      const duplicateItem = await prisma.agentWatchlistItem.findFirst({
        where: {
          agentId,
          symbol: data.symbol,
          id: { not: itemId }
        }
      });

      if (duplicateItem) {
        return NextResponse.json(
          { error: `${data.symbol} is already in the watchlist` },
          { status: 400 }
        );
      }
    }

    // Update the watchlist item
    const updatedItem = await prisma.agentWatchlistItem.update({
      where: { id: itemId },
      data: {
        ...data,
        lastReviewedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      watchlistItem: updatedItem
    });

  } catch (error) {
    console.error('Failed to update watchlist item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a watchlist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: agentId, itemId } = await params;

    // Check if watchlist item exists and belongs to the agent
    const existingItem = await prisma.agentWatchlistItem.findFirst({
      where: {
        id: itemId,
        agentId: agentId
      }
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    // Delete the watchlist item
    await prisma.agentWatchlistItem.delete({
      where: { id: itemId }
    });

    return NextResponse.json({
      success: true,
      message: 'Watchlist item deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete watchlist item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}