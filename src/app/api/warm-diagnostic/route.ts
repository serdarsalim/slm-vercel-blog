// src/app/api/warm-diagnostic/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Record of our warming operations
const warmingLog = {
  operations: [],
  latestTimestamp: null
};

export async function GET(request: NextRequest) {
  // Return the warming status for diagnostics
  return NextResponse.json({
    warmingLog,
    currentTime: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    
    // Validate token
    if (body.secret !== secretToken && body.token !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Record this warming operation with a unique ID
    const operationId = `warm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Add to our operations log (keep only last 10)
    warmingLog.operations.unshift({
      id: operationId,
      timestamp: new Date().toISOString(),
      paths: body.paths || [],
      status: 'initiated'
    });
    
    // Keep log size manageable
    if (warmingLog.operations.length > 10) {
      warmingLog.operations = warmingLog.operations.slice(0, 10);
    }
    
    warmingLog.latestTimestamp = new Date().toISOString();

    // Return the operation ID for tracking
    return NextResponse.json({
      success: true,
      operationId,
      message: 'Warming diagnostic recorded'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}