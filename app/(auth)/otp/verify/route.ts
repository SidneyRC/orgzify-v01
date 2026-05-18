import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required.' }, { status: 400 });
    }

    // Find matching valid OTP in otp_logs
    const { data, error } = await supabase
      .from('otp_logs')
      .select('id, expires_at, is_used')
      .eq('email', email)
      .eq('otp_code', otp)
      .eq('purpose', 'registration')
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Invalid OTP.' }, { status: 400 });
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'OTP has expired. Please resend.' }, { status: 400 });
    }

    // Mark OTP as used
    await supabase.from('otp_logs').update({ is_used: true }).eq('id', data.id);

    return NextResponse.json({ success: true, message: 'OTP verified successfully.' });

  } catch (err) {
    console.error('[verify-otp] Error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
