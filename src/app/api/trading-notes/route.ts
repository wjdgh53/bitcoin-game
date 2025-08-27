// Trading Notes API routes

import { NextRequest, NextResponse } from 'next/server';
import { tradingNotesService } from '@/lib/services/trading-notes-service';
import { TradingNoteInputSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

// Simple authentication mock for testing
function validateAuth(request: NextRequest) {
  // For demo purposes, we'll use a mock user
  // In production, you would validate JWT token from headers
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Mock user for testing
  return {
    id: 'demo-user-123',
    email: 'demo@example.com'
  };
}

const SearchSchema = z.object({
  query: z.string().min(1),
  includePublic: z.boolean().optional().default(false),
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
    const validatedData = TradingNoteInputSchema.parse(body);

    const note = await tradingNotesService.createNote(user.id, validatedData);

    return NextResponse.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Note creation error:', error);
    
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
      // Search notes
      const searchData = SearchSchema.parse({
        query,
        includePublic: searchParams.get('includePublic') === 'true',
        limit: Math.min(limit, 50)
      });

      const results = await tradingNotesService.searchNotes(
        user.id,
        searchData.query,
        searchData.includePublic,
        searchData.limit
      );

      return NextResponse.json({
        success: true,
        data: results
      });
    } else {
      // Get all user notes
      const notes = await tradingNotesService.getUserNotes(user.id, limit, offset);

      return NextResponse.json({
        success: true,
        data: notes
      });
    }
  } catch (error) {
    console.error('Notes retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notes' },
      { status: 500 }
    );
  }
}