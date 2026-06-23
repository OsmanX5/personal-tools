import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Playlist from "@/models/playlist";

export async function GET() {
  await dbConnect();
  const playlists = await Playlist.find().sort({ createdAt: 1 });
  return NextResponse.json(playlists);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const playlist = await Playlist.create(body);
  return NextResponse.json(playlist, { status: 201 });
}
