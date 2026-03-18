import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WeightEntry from "@/models/weight_entry";
import UserSettings from "@/models/user_settings";

export async function GET() {
  await dbConnect();
  const entries = await WeightEntry.find().sort({ date: -1 });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();

  const settings = await UserSettings.findOne();
  if (settings?.height && body.weight) {
    const heightM = settings.height / 100;
    body.bmi = Math.round((body.weight / (heightM * heightM)) * 100) / 100;
  }

  const entry = await WeightEntry.create(body);
  return NextResponse.json(entry, { status: 201 });
}
