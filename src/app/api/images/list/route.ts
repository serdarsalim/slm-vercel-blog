import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getServiceRoleClient } from "@/lib/auth-config";

const BUCKET = "images";
const FOLDER = "slm";

async function ensureAdmin(sessionEmail: string) {
  const client = getServiceRoleClient();
  const { data: author } = await client
    .from("authors")
    .select("id, role")
    .eq("email", sessionEmail)
    .maybeSingle();

  return Boolean(author && author.role === "admin");
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await ensureAdmin(session.user.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || "100");
  const offset = Number(searchParams.get("offset") || "0");

  const client = getServiceRoleClient();
  const { data, error } = await client.storage.from(BUCKET).list(FOLDER, {
    limit,
    offset,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const images = (data || [])
    .filter((item) => item.name)
    .filter((item) => /\.(png|jpe?g|gif|webp|svg)$/i.test(item.name))
    .map((item) => {
      const path = `${FOLDER}/${item.name}`;
      const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(path);
      return { name: path, url: urlData.publicUrl };
    });

  return NextResponse.json({ images });
}
