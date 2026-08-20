// Downloads a Google profile photo, converts to WebP, uploads to avatars bucket.
// Returns the public URL, or empty string if anything fails (safe fallback).

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import sharp from "sharp";

export async function uploadGooglePhoto(photoUrl: string, profileId: string): Promise<string> {
  if (!photoUrl) return "";

  try {
    const res = await fetch(photoUrl);
    if (!res.ok) return "";

    const inputBuffer = Buffer.from(await res.arrayBuffer());
    const webpBuffer = await sharp(inputBuffer)
      .resize(400, 400, { fit: "cover", position: "center" })
      .webp({ quality: 85 })
      .toBuffer();

    const fileName = `${profileId}.webp`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, webpBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Google photo upload error:", uploadError.message);
      return "";
    }

    const { data } = supabaseAdmin.storage.from("avatars").getPublicUrl(fileName);
    return data.publicUrl;
  } catch (err) {
    console.error("Google photo processing error:", err);
    return "";
  }
}