import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NetWorthAccount from "@/models/networth_account";

export async function GET() {
  await dbConnect();
  const accounts = await NetWorthAccount.find().sort({ createdAt: -1 });
  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const account = await NetWorthAccount.create(body);
  return NextResponse.json(account, { status: 201 });
}
