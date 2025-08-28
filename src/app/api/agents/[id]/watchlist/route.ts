import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma-client';

// Validation schema for watchlist item creation/update
const watchlistItemSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  name: z.string().min(1).max(100),
  category: z.enum(['장기투자', '단기트레이딩', '모멘텀', '가치투자', '성장주', '배당주', '투기적투자', '안전자산', '대체투자']),
  reason: z.string().min(1).max(500),
  agentView: z.string().min(1).max(500),
  alertPrice: z.number().positive().optional(),
  alertType: z.enum(['above', 'below', 'both']).optional(),
  isActive: z.boolean().default(true),
});

// GET: Get all watchlist items for an agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = { agentId };
    if (category) {
      where.category = category;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    // Get watchlist items for the agent
    const watchlistItems = await prisma.agentWatchlistItem.findMany({
      where,
      orderBy: [
        { addedAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      watchlistItems
    });

  } catch (error) {
    console.error('Failed to get agent watchlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new watchlist item for an agent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = watchlistItemSchema.safeParse(body);
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

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if the symbol already exists in the agent's watchlist
    const existingItem = await prisma.agentWatchlistItem.findFirst({
      where: {
        agentId,
        symbol: data.symbol
      }
    });

    if (existingItem) {
      return NextResponse.json(
        { error: `${data.symbol} is already in the watchlist` },
        { status: 400 }
      );
    }

    // Create the watchlist item
    const watchlistItem = await prisma.agentWatchlistItem.create({
      data: {
        ...data,
        agentId
      }
    });

    return NextResponse.json({
      success: true,
      watchlistItem
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create watchlist item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}