import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getServiceRoleClient } from "@/lib/auth-config";

const BUCKET = "images";
const FOLDER = "slm/";

async function ensureAdmin(sessionEmail: string) {
  const client = getServiceRoleClient();
  const { data: author } = await client
    .from("authors")
    .select("id, role")
    .eq("email", sessionEmail)
    .maybeSingle();

  return Boolean(author && author.role === "admin");
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await ensureAdmin(session.user.email);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const path = body?.path as string | undefined;
  if (!path || !path.startsWith(FOLDER)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const client = getServiceRoleClient();
  const { error } = await client.storage.from(BUCKET).remove([path]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
