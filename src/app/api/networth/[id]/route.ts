import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NetWorthAccount from "@/models/networth_account";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const account = await NetWorthAccount.findById(id);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json(account);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const account = await NetWorthAccount.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json(account);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const account = await NetWorthAccount.findByIdAndDelete(id);

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
