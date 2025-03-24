// src/app/api/delete-abdulhamit/route.ts
// This is a one-time use endpoint specifically for your problem file

import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const log = (message: string) => {
    console.log(message);
    logs.push(message);
  };

  try {
    log("Starting specific file deletion");
    
    // The target filename we're looking for
    const targetFilename = "2_-ABDULHAMIT-TUGRA-TURKCE1";
    log(`Target filename: ${targetFilename}`);
    
    // Get all blobs
    const blobs = await list();
    log(`Found ${blobs.blobs.length} total blobs`);
    
    // Find all matching blobs
    const matchingBlobs = blobs.blobs.filter(blob => {
      const pathname = blob.pathname;
      return pathname.includes(targetFilename);
    });
    
    log(`Found ${matchingBlobs.length} matching blobs for "${targetFilename}"`);
    
    if (matchingBlobs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No matching files found',
        logs
      });
    }
    
    // Log all matching blobs
    matchingBlobs.forEach((blob, index) => {
      log(`Match ${index + 1}: ${blob.pathname}`);
    });
    
    // Delete each matching blob
    const results = await Promise.all(
      matchingBlobs.map(async (blob) => {
        try {
          log(`Deleting: ${blob.pathname}`);
          const result = await del(blob.pathname);
          log(`Successfully deleted: ${blob.pathname}`);
          return { pathname: blob.pathname, success: true };
        } catch (error) {
          log(`Error deleting ${blob.pathname}: ${error instanceof Error ? error.message : String(error)}`);
          return { 
            pathname: blob.pathname, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );
    
    // Count successes and failures
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    return NextResponse.json({
      success: successful > 0,
      deleted: successful,
      failed,
      results,
      logs
    });
    
  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs
    }, { status: 500 });
  }
}