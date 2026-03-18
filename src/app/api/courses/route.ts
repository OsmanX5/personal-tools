import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Course from "@/models/course";

export async function GET() {
  await dbConnect();
  const courses = await Course.find().sort({ createdAt: -1 });
  return NextResponse.json(courses);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const course = await Course.create(body);
  return NextResponse.json(course, { status: 201 });
}
