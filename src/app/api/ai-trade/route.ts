// API route for AI trading decisions

import { NextResponse } from 'next/server';
import { aiTradingAgent } from '@/lib/services/ai-trading-agent';

export async function POST() {
  try {
    // AI 분석 및 결정
    const decision = await aiTradingAgent.analyzeAndDecide();
    
    // 거래 실행
    const result = await aiTradingAgent.executeTradingDecision(decision);

    return NextResponse.json({
      success: true,
      decision,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Trade API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'AI 거래 분석 실패',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for analysis only (no trading)
export async function GET() {
  try {
    const decision = await aiTradingAgent.analyzeAndDecide();

    return NextResponse.json({
      success: true,
      decision,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Analysis API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'AI 분석 실패',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}