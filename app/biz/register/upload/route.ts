// Entity Document Photo Upload API
// Route: POST /biz/register/upload
// Receives: file, entity_id, document_type_id, side ('front' | 'back')
// Converts to WebP (small size, high quality) → uploads to entity-documents bucket
// → saves URL into entity_documents.front_url / back_url

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import sharp from "sharp";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); } catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("photo") as File | null;
  const entityId = formData.get("entity_id") as string | null;
  const documentTypeId = formData.get("document_type_id") as string | null;
  const side = formData.get("side") as string | null;

  if (!file) return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  if (!entityId || !documentTypeId) return NextResponse.json({ error: "Missing entity_id or document_type_id" }, { status: 400 });
  if (side !== "front" && side !== "back") return NextResponse.json({ error: "Invalid side" }, { status: 400 });

  const { data: entity, error: entityError } = await supabaseAdmin
    .from("entities").select("id").eq("id", entityId).eq("user_id", session.user_id).maybeSingle();
  if (entityError || !entity) return NextResponse.json({ error: "Entity not found or access denied" }, { status: 403 });

  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Photo must be under 5MB" }, { status: 400 });

  let webpBuffer: Buffer;
  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    // Resize to a sensible max dimension (documents don't need to be huge),
    // then compress hard on effort while keeping quality high — smallest
    // file size for the clearest readable image.
    webpBuffer = await sharp(inputBuffer)
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }

  const fileName = `${entityId}_${documentTypeId}_${side}.webp`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("entity-documents")
    .upload(fileName, webpBuffer, { contentType: "image/webp", upsert: true });
  if (uploadError) return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });

  const { data: pub } = supabaseAdmin.storage.from("entity-documents").getPublicUrl(fileName);
  const urlColumn = side === "front" ? "front_url" : "back_url";

  const { error: dbError } = await supabaseAdmin.from("entity_documents").upsert({
    entity_id: entityId, document_type_id: documentTypeId,
    [urlColumn]: pub.publicUrl, created_by: session.user_id, updated_at: new Date().toISOString()
  }, { onConflict: "entity_id,document_type_id" });
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ url: pub.publicUrl }, { status: 200 });
}
