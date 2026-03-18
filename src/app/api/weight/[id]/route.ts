import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WeightEntry from "@/models/weight_entry";
import UserSettings from "@/models/user_settings";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  if (body.weight) {
    const settings = await UserSettings.findOne();
    if (settings?.height) {
      const heightM = settings.height / 100;
      body.bmi = Math.round((body.weight / (heightM * heightM)) * 100) / 100;
    }
  }

  const entry = await WeightEntry.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const entry = await WeightEntry.findByIdAndDelete(id);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
