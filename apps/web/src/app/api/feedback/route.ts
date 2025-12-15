import { NextRequest, NextResponse } from 'next/server';

// Rate limiting: simple in-memory store (resets on server restart)
const submissionTimes = new Map<string, number>();
const RATE_LIMIT_MS = 60000; // 1 minute between submissions per IP

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    const lastSubmission = submissionTimes.get(ip);
    if (lastSubmission && Date.now() - lastSubmission < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: 'Please wait a minute before submitting again' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { rating, message, email, source_page, user_agent } = body;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Update rate limit
    submissionTimes.set(ip, Date.now());

    // Log feedback (can be enhanced to save to database or send to external service)
    const feedbackData = {
      timestamp: new Date().toISOString(),
      rating: rating || null,
      message: message.trim(),
      email: email || null,
      source_page: source_page || '/',
      user_agent: user_agent || null,
      ip,
    };

    console.log('[FEEDBACK RECEIVED]', JSON.stringify(feedbackData, null, 2));

    // Try to forward to demo API if available
    try {
      const demoApiUrl = process.env.DEMO_API_URL || 'https://demo-api.aiqso.io';
      await fetch(`${demoApiUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feedbackData,
          source: 'bible-games',
          type: 'feedback',
        }),
      });
    } catch {
      // Silent fail - feedback is still logged locally
      console.log('[FEEDBACK] Could not forward to demo API');
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback received. Thank you!'
    });

  } catch (error) {
    console.error('[FEEDBACK ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
