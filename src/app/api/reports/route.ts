// API routes for analysis reports

import { NextRequest, NextResponse } from 'next/server';
import { reportService } from '@/lib/services/report-service';

// GET /api/reports - Get all reports or by agent type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentType = searchParams.get('agent');
    const limit = parseInt(searchParams.get('limit') || '50');

    let reports;
    if (agentType) {
      reports = await reportService.getReportsByAgent(agentType, limit);
    } else {
      reports = await reportService.getAllReports(limit);
    }

    return NextResponse.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Get reports API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Generate new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentType } = body;

    if (!agentType) {
      return NextResponse.json(
        { success: false, message: 'Agent type required' },
        { status: 400 }
      );
    }

    // Verify agent exists in database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const agent = await prisma.agent.findUnique({
      where: { type: agentType }
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Agent not found' },
        { status: 404 }
      );
    }

    const report = await reportService.generateReport(agentType);

    return NextResponse.json({
      success: true,
      data: report,
      message: `${report.agentName} 분석 리포트가 생성되었습니다`
    });
  } catch (error) {
    console.error('Generate report API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate report' },
      { status: 500 }
    );
  }
}