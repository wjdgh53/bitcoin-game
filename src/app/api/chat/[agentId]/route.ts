import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { parseCommand, generateCommandResponse, validateCommand } from '@/lib/chat/commandParser';

const prisma = new PrismaClient();

// Schema for message creation
const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  type: z.enum(['user', 'agent', 'system']).default('user'),
  metadata: z.string().optional().default('{}'),
});

// GET /api/chat/[agentId] - Get conversation history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get messages for this agent
    const messages = await prisma.chatMessage.findMany({
      where: { agentId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ 
      success: true, 
      messages: messages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
      }))
    });

  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/[agentId] - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validatedData = createMessageSchema.parse(body);

    // Verify agent exists
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        patterns: true,
        watchlistItems: true,
      }
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Create user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        agentId,
        content: validatedData.content,
        type: 'user',
        metadata: validatedData.metadata,
        userId: 'demo-user',
      },
    });

    // Parse user command and generate intelligent response
    const parsedCommand = parseCommand(validatedData.content, agent);
    const validationResult = validateCommand(parsedCommand, agent);
    
    let agentResponse;
    if (!validationResult.valid) {
      agentResponse = {
        content: `${agent.name}: ${validationResult.reason} ${validationResult.suggestions?.join(' ') || ''}`,
        metadata: {
          type: 'validation_error',
          reason: validationResult.reason,
          suggestions: validationResult.suggestions
        }
      };
    } else {
      agentResponse = generateCommandResponse(parsedCommand, agent);
    }
    
    const agentMessage = await prisma.chatMessage.create({
      data: {
        agentId,
        content: agentResponse.content,
        type: 'agent',
        metadata: JSON.stringify(agentResponse.metadata),
        userId: 'demo-user',
      },
    });

    return NextResponse.json({
      success: true,
      userMessage: {
        ...userMessage,
        createdAt: userMessage.createdAt.toISOString(),
        updatedAt: userMessage.updatedAt.toISOString(),
      },
      agentResponse: {
        ...agentMessage,
        createdAt: agentMessage.createdAt.toISOString(),
        updatedAt: agentMessage.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to send message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Generate agent response based on personality and message content
async function generateAgentResponse(agent: any, userMessage: string) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check if this is a command
  if (lowerMessage.includes('전략') && (lowerMessage.includes('수정') || lowerMessage.includes('바꿔') || lowerMessage.includes('변경'))) {
    return {
      content: `${agent.name}: 전략을 수정하시겠어요? 현재 제가 가지고 있는 전략들을 검토해보겠습니다. 어떤 부분을 변경하고 싶으신지 더 자세히 말씀해 주세요.`,
      metadata: {
        type: 'strategy_inquiry',
        suggestions: [
          '새로운 투자 전략 추가',
          '기존 전략 비중 조정',
          '리스크 관리 방법 변경'
        ]
      }
    };
  }
  
  if (lowerMessage.includes('패턴') && lowerMessage.includes('추가')) {
    return {
      content: `${agent.name}: 새로운 매매 패턴을 추가하시는군요! 현재 제가 ${agent.patterns?.length || 0}개의 패턴을 보유하고 있습니다. 어떤 종류의 패턴을 추가하고 싶으신가요?`,
      metadata: {
        type: 'pattern_inquiry',
        currentPatterns: agent.patterns?.length || 0,
        suggestions: [
          '기술적 분석 패턴',
          '시장 심리 패턴',
          '거래량 기반 패턴'
        ]
      }
    };
  }
  
  if (lowerMessage.includes('관심종목') || lowerMessage.includes('종목')) {
    return {
      content: `${agent.name}: 관심종목을 관리하시려고 하시는군요. 현재 제가 모니터링하는 종목은 ${agent.watchlistItems?.length || 0}개입니다. 새로운 종목을 추가하거나 기존 종목을 수정하시겠어요?`,
      metadata: {
        type: 'watchlist_inquiry',
        currentCount: agent.watchlistItems?.length || 0,
        suggestions: [
          '새 종목 추가',
          '알림 가격 설정',
          '관심 종목 분석 요청'
        ]
      }
    };
  }

  // Default responses based on personality
  const personalityResponses = {
    conservative: [
      `${agent.name}: 안전한 투자를 선호하시는군요. 신중한 접근이 중요합니다.`,
      `${agent.name}: 리스크를 최소화하면서 안정적인 수익을 추구하는 것이 좋겠습니다.`,
      `${agent.name}: 장기적인 관점에서 검토해보겠습니다.`
    ],
    aggressive: [
      `${agent.name}: 공격적인 전략으로 높은 수익을 노려보겠습니다!`,
      `${agent.name}: 시장 기회를 놓치지 않고 적극적으로 대응하겠습니다.`,
      `${agent.name}: 큰 수익을 위해서는 과감한 결정이 필요할 때가 있죠.`
    ],
    balanced: [
      `${agent.name}: 균형잡힌 접근으로 안정성과 수익성을 모두 고려해보겠습니다.`,
      `${agent.name}: 리스크와 리턴의 최적 균형점을 찾아보겠습니다.`,
      `${agent.name}: 다양한 관점에서 종합적으로 검토하겠습니다.`
    ],
    quantitative: [
      `${agent.name}: 데이터를 기반으로 정량적 분석을 해보겠습니다.`,
      `${agent.name}: 통계적 모델과 수학적 접근으로 최적해를 찾겠습니다.`,
      `${agent.name}: 객관적인 지표들을 활용해 분석하겠습니다.`
    ],
    contrarian: [
      `${agent.name}: 시장의 반대편에서 기회를 찾아보겠습니다.`,
      `${agent.name}: 대중의 심리와 반대로 움직일 때 진정한 기회가 있죠.`,
      `${agent.name}: 모두가 팔 때 사고, 모두가 살 때 파는 역발상 전략을 고려해보겠습니다.`
    ]
  };

  const responses = personalityResponses[agent.personality as keyof typeof personalityResponses] || personalityResponses.balanced;
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  return {
    content: randomResponse,
    metadata: {
      personality: agent.personality,
      timestamp: new Date().toISOString()
    }
  };
}