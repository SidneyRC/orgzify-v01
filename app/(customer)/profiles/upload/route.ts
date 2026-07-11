// OREV1-031 — Profile Photo Upload API
// Route: POST /profiles/upload
// Works for ALL profiles — master, spouse, sub-profiles
// Receives image + profile_id → converts to WebP → saves to avatars/{profile_id}.webp → returns public URL

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import sharp from "sharp";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  // ── 1. Auth check ──────────────────────────────────────────────────────────
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // ── 2. Parse form data ─────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("photo") as File | null;
  const profileId = formData.get("profile_id") as string | null;

  if (!file)      return NextResponse.json({ error: "No photo provided" },  { status: 400 });
  if (!profileId) return NextResponse.json({ error: "No profile_id provided" }, { status: 400 });

  // ── 3. Verify this profile belongs to the logged-in user ───────────────────
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", session.user_id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found or access denied" }, { status: 403 });
  }

  // ── 4. Validate file ───────────────────────────────────────────────────────
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Photo must be under 5MB" }, { status: 400 });
  }

  // ── 5. Convert to WebP ─────────────────────────────────────────────────────
  let webpBuffer: Buffer;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    webpBuffer = await sharp(inputBuffer)
      .resize(400, 400, { fit: "cover", position: "center" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }

  // ── 6. Upload to Supabase avatars bucket — one photo per profile ───────────
  const fileName = `${profileId}.webp`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(fileName, webpBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError.message);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  // ── 7. Return public URL ───────────────────────────────────────────────────
  const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(fileName);

  return NextResponse.json({ url: data.publicUrl }, { status: 200 });
}
