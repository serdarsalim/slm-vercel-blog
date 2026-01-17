import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getServiceRoleClient } from "@/lib/auth-config";

const TABLE = "comments";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const client = getServiceRoleClient();
  const { data, error } = await client
    .from(TABLE)
    .select("id, post_slug, author_name, author_email, content, created_at")
    .eq("post_slug", slug)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const slug = (body?.slug as string | undefined)?.trim();
  const content = (body?.content as string | undefined)?.trim();

  if (!slug || !content) {
    return NextResponse.json({ error: "Missing slug or content" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  const client = getServiceRoleClient();
  const { data, error } = await client
    .from(TABLE)
    .insert({
      post_slug: slug,
      author_email: session.user.email,
      author_name: session.user.name || session.user.email,
      content,
    })
    .select("id, post_slug, author_name, author_email, content, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to post comment" }, { status: 500 });
  }

  return NextResponse.json({ comment: data });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = getServiceRoleClient();
  const { data: author } = await client
    .from("authors")
    .select("role")
    .eq("email", session.user.email)
    .maybeSingle();

  const isAdmin = author?.role === "admin";

  const body = await request.json();
  const id = (body?.id as string | undefined)?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing comment id" }, { status: 400 });
  }

  const { data: comment, error: fetchError } = await client
    .from(TABLE)
    .select("id, author_email")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (!isAdmin && comment.author_email !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await client.from(TABLE).delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
