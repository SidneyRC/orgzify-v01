import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Check email exists using DB function
    const { data: exists, error: checkError } = await supabaseAdmin
      .rpc("check_email_exists", { p_email: email });

    if (checkError) {
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }

    // Always return success — never reveal if email exists or not
    if (!exists) {
      return NextResponse.json({ success: true });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    // Save OTP to otp_logs
    const { error: otpError } = await supabaseAdmin
      .from("otp_logs")
      .insert({
        email,
       otp_code: otp,
        purpose: "password-reset",
        expires_at: expiresAt.toISOString(),
        is_used: false,
      });

    if (otpError) {
      return NextResponse.json({ error: "Failed to generate OTP. Please try again." }, { status: 500 });
    }

    // Send email
await sendEmail({
  purpose: "password-reset",
  to: email,
  name: "User",
  otp,
});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
