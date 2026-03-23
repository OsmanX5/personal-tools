import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import EmergencyFundConfig from "@/models/emergency_fund_config";

export async function GET() {
  await dbConnect();
  let config = await EmergencyFundConfig.findOne();
  if (!config) {
    config = await EmergencyFundConfig.create({
      targetType: "months",
      targetMonths: 6,
      fixedTargetCurrency: "USD",
    });
  }
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  await dbConnect();
  const body = await request.json();

  // Upsert singleton
  const config = await EmergencyFundConfig.findOneAndUpdate({}, body, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  return NextResponse.json(config);
}
