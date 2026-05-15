import { getOpportunitiesPage } from "@/lib/opportunities-data";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawLimit = Number(searchParams.get("limit"));
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 4, 1), 20);
  const cursor = searchParams.get("cursor");
  const body = getOpportunitiesPage(limit, cursor);
  return NextResponse.json(body);
}
