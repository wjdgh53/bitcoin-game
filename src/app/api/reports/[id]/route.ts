// API route for individual report

import { NextRequest, NextResponse } from 'next/server';
import { reportService } from '@/lib/services/report-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const report = await reportService.getReportById(id);

    if (!report) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report by ID API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get report' },
      { status: 500 }
    );
  }
}