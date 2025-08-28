// API route for generating mock technical indicators data

import { NextRequest, NextResponse } from 'next/server';
import { technicalIndicatorsService } from '@/lib/services/technical-indicators-service';

export async function POST(request: NextRequest) {
  try {
    // Generate mock technical indicators and analysis
    const mockData = await technicalIndicatorsService.generateMockData();

    if (!mockData) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate mock data'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mockData,
      message: 'Mock technical indicators and analysis generated successfully'
    });

  } catch (error) {
    console.error('Error generating mock data:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate mock technical data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}