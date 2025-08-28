import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/prisma-client';

// Validation schema for pattern creation/update
const patternSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  priority: z.number().int().min(1).max(10).default(5),
  confidenceRate: z.number().min(0).max(100).default(0),
  examples: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

// GET: Get all patterns for an agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;

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

    // Get patterns for the agent
    const patterns = await prisma.pattern.findMany({
      where: { agentId },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Parse examples JSON strings back to arrays
    const patternsWithParsedExamples = patterns.map(pattern => ({
      ...pattern,
      examples: JSON.parse(pattern.examples)
    }));

    return NextResponse.json({
      success: true,
      patterns: patternsWithParsedExamples
    });

  } catch (error) {
    console.error('Failed to get agent patterns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new pattern for an agent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = patternSchema.safeParse(body);
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

    // Create the pattern
    const pattern = await prisma.pattern.create({
      data: {
        ...data,
        agentId,
        examples: JSON.stringify(data.examples)
      }
    });

    // Return pattern with parsed examples
    const patternWithParsedExamples = {
      ...pattern,
      examples: JSON.parse(pattern.examples)
    };

    return NextResponse.json({
      success: true,
      pattern: patternWithParsedExamples
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create pattern:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}