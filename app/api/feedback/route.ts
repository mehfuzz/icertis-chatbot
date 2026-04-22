import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { FeedbackType } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.logId || !body?.feedback) {
    return NextResponse.json(
      { error: 'logId and feedback are required' },
      { status: 400 }
    );
  }

  const feedback = body.feedback as FeedbackType;
  if (!['positive', 'negative'].includes(feedback)) {
    return NextResponse.json({ error: 'feedback must be positive or negative' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Update the query log with feedback
  const { data: logData, error: logError } = await supabase
    .from('query_logs')
    .update({ feedback, feedback_note: body.note ?? null })
    .eq('id', body.logId)
    .select('query_text, response_text')
    .single();

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  // Auto-flag negative feedback for review
  if (feedback === 'negative' && logData) {
    await supabase.from('review_queue').insert({
      log_id: body.logId,
      query_text: logData.query_text,
      response_text: logData.response_text,
      reason: body.note || 'User marked response as unhelpful',
    });
  }

  return NextResponse.json({ success: true });
}
