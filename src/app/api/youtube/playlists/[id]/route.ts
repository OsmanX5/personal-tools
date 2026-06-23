import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Playlist from "@/models/playlist";
import Video from "@/models/video";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const playlist = await Playlist.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  return NextResponse.json(playlist);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const playlist = await Playlist.findByIdAndDelete(id);

  if (!playlist) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  // Detach the deleted playlist from any videos that referenced it.
  await Video.updateMany(
    { playlistIds: id },
    { $pull: { playlistIds: id } },
  );

  return NextResponse.json({ ok: true });
}
