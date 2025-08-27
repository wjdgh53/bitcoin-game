// Trading Notes individual note API routes

import { NextRequest, NextResponse } from 'next/server';
import { tradingNotesService } from '@/lib/services/trading-notes-service';
import { TradingNoteUpdateInputSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

// Simple authentication mock for testing
function validateAuth(request: NextRequest) {
  // For demo purposes, we'll use a mock user
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return {
    id: 'demo-user-123',
    email: 'demo@example.com'
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = validateAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const note = await tradingNotesService.getNoteById(params.id, user.id);
    
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Note retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve note' },
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
    const validatedData = TradingNoteUpdateInputSchema.parse(body);

    const updatedNote = await tradingNotesService.updateNote(
      params.id,
      user.id,
      validatedData
    );

    if (!updatedNote) {
      return NextResponse.json({ error: 'Note not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedNote
    });
  } catch (error) {
    console.error('Note update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update note' },
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

    const deleted = await tradingNotesService.deleteNote(params.id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Note not found or deletion failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Note deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}