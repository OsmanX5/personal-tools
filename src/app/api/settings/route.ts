import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import UserSettings from "@/models/user_settings";
import WeightEntry from "@/models/weight_entry";

export async function GET() {
  await dbConnect();
  const settings = await UserSettings.findOne();
  return NextResponse.json(settings ?? { height: null });
}

export async function PUT(request: NextRequest) {
  await dbConnect();
  const body = await request.json();

  const settings = await UserSettings.findOneAndUpdate({}, body, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  // Recalculate BMI on all weight entries when height changes
  if (typeof body.height === "number" && body.height > 0) {
    const heightM = body.height / 100;
    const entries = await WeightEntry.find();
    const bulkOps = entries.map((entry) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: {
          bmi: Math.round((entry.weight / (heightM * heightM)) * 100) / 100,
        },
      },
    }));
    if (bulkOps.length > 0) {
      await WeightEntry.bulkWrite(bulkOps);
    }
  }

  return NextResponse.json(settings);
}
