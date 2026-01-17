import { NextRequest, NextResponse } from "next/server";

const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";

export async function GET(request: NextRequest) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing Pexels API key" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const perPage = searchParams.get("per_page") ?? "18";
  const page = searchParams.get("page") ?? "1";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const url = `${PEXELS_ENDPOINT}?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: "Pexels request failed", detail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
