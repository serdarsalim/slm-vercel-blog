import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getServiceRoleClient } from "@/lib/auth-config";

export const maxDuration = 60;

const BUCKET = "images";

async function ensureAdmin(sessionEmail: string) {
  const client = getServiceRoleClient();
  const { data: author } = await client
    .from("authors")
    .select("id, role")
    .eq("email", sessionEmail)
    .maybeSingle();

  if (!author || author.role !== "admin") {
    return false;
  }

  return true;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await ensureAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const extension = file.type.split("/")[1] || "jpg";
    const safeName = sanitizeFilename(file.name || `image.${extension}`);
    const path = `slm/${Date.now()}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const client = getServiceRoleClient();
    const { error } = await client.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
