import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import QuickLink from "@/models/quick_link";

export async function GET() {
  await dbConnect();
  const links = await QuickLink.find().sort({ createdAt: 1 });
  return NextResponse.json(links);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const link = await QuickLink.create({ url: body.url });
  return NextResponse.json(link, { status: 201 });
}
