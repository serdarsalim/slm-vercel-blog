import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    // Verify webhook signature if you have one configured
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (webhookSecret) {
      const signature = request.headers.get('x-webhook-signature');
      if (signature !== webhookSecret) {
        return NextResponse.json({ success: false, message: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Parse webhook payload
    const payload = await request.json();
    console.log('Supabase webhook triggered:', payload);

    return NextResponse.json({
      success: true,
      message: "Webhook received; sitemap is generated dynamically",
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in Supabase webhook:", error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update sitemap via webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
