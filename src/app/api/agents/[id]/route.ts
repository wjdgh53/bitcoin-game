import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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