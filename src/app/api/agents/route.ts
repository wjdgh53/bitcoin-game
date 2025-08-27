import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - 모든 에이전트 조회
export async function GET(request: NextRequest) {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: agents
    });
  } catch (error) {
    console.error('Get agents API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST - 새 에이전트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, personality, strategy, description } = body;

    if (!name || !type || !personality || !strategy || !description) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // 타입 중복 확인
    const existingAgent = await prisma.agent.findUnique({
      where: { type }
    });

    if (existingAgent) {
      return NextResponse.json(
        { success: false, message: 'Agent type already exists' },
        { status: 409 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        type,
        personality,
        strategy,
        description
      }
    });

    return NextResponse.json({
      success: true,
      data: agent,
      message: 'Agent created successfully'
    });
  } catch (error) {
    console.error('Create agent API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create agent' },
      { status: 500 }
    );
  }
}