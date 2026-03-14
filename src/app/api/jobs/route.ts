import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Job from "@/models/job";

export async function GET() {
  await dbConnect();
  const jobs = await Job.find().sort({ createdAt: -1 });
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const job = await Job.create(body);
  return NextResponse.json(job, { status: 201 });
}
