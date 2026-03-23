import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import IncomeStream from "@/models/income_stream";

export async function GET() {
  await dbConnect();
  const streams = await IncomeStream.find().sort({ createdAt: -1 });
  return NextResponse.json(streams);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const stream = await IncomeStream.create(body);
  return NextResponse.json(stream, { status: 201 });
}
