import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - 특정 에이전트 조회 (패턴과 관심종목 포함)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        patterns: {
          orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
        },
        watchlistItems: {
          orderBy: { addedAt: 'desc' }
        }
      }
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Agent not found' },
        { status: 404 }
      );
    }

    // Parse strategy field and pattern examples
    const processedAgent = {
      ...agent,
      strategy: typeof agent.strategy === 'string' ? JSON.parse(agent.strategy) : agent.strategy,
      patterns: agent.patterns.map(pattern => ({
        ...pattern,
        examples: JSON.parse(pattern.examples)
      }))
    };

    return NextResponse.json({
      success: true,
      data: processedAgent
    });
  } catch (error) {
    console.error('Get agent API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

// PUT - 에이전트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, personality, strategy, description } = body;

    if (!name || !personality || !strategy || !description) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        name,
        personality,
        strategy,
        description,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: agent,
      message: 'Agent updated successfully'
    });
  } catch (error) {
    console.error('Update agent API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// PATCH - 에이전트 활성화/비활성화 토글
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        isActive,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: agent,
      message: `Agent ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle agent API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to toggle agent status' },
      { status: 500 }
    );
  }
}

// DELETE - 에이전트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    await prisma.agent.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Delete agent API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}