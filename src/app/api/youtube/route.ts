import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Video from "@/models/video";

export async function GET() {
  await dbConnect();
  const videos = await Video.find().sort({ createdAt: -1 });
  return NextResponse.json(videos);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const video = await Video.create(body);
  return NextResponse.json(video, { status: 201 });
}
