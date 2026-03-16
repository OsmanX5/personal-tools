import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WeightEntry from "@/models/weight_entry";

export async function GET() {
  await dbConnect();
  const entries = await WeightEntry.find().sort({ date: -1 });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const entry = await WeightEntry.create(body);
  return NextResponse.json(entry, { status: 201 });
}
