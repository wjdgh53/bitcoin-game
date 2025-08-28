import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma-client';

// Validation schema for pattern updates
const patternUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  confidenceRate: z.number().min(0).max(100).optional(),
  examples: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// GET: Get a specific pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patternId: string }> }
) {
  try {
    const { id: agentId, patternId } = await params;

    // Find the pattern
    const pattern = await prisma.pattern.findFirst({
      where: {
        id: patternId,
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

    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }

    // Parse examples JSON string back to array
    const patternWithParsedExamples = {
      ...pattern,
      examples: JSON.parse(pattern.examples)
    };

    return NextResponse.json({
      success: true,
      pattern: patternWithParsedExamples
    });

  } catch (error) {
    console.error('Failed to get pattern:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update a pattern
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patternId: string }> }
) {
  try {
    const { id: agentId, patternId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = patternUpdateSchema.safeParse(body);
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

    // Check if pattern exists and belongs to the agent
    const existingPattern = await prisma.pattern.findFirst({
      where: {
        id: patternId,
        agentId: agentId
      }
    });

    if (!existingPattern) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = { ...data };
    if (data.examples) {
      updateData.examples = JSON.stringify(data.examples);
    }

    // Update the pattern
    const updatedPattern = await prisma.pattern.update({
      where: { id: patternId },
      data: updateData
    });

    // Return pattern with parsed examples
    const patternWithParsedExamples = {
      ...updatedPattern,
      examples: JSON.parse(updatedPattern.examples)
    };

    return NextResponse.json({
      success: true,
      pattern: patternWithParsedExamples
    });

  } catch (error) {
    console.error('Failed to update pattern:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a pattern
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patternId: string }> }
) {
  try {
    const { id: agentId, patternId } = await params;

    // Check if pattern exists and belongs to the agent
    const existingPattern = await prisma.pattern.findFirst({
      where: {
        id: patternId,
        agentId: agentId
      }
    });

    if (!existingPattern) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }

    // Delete the pattern
    await prisma.pattern.delete({
      where: { id: patternId }
    });

    return NextResponse.json({
      success: true,
      message: 'Pattern deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete pattern:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}