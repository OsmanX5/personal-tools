import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/expense";

/**
 * POST /api/budget/expenses/recurring
 *
 * Handles all recurring series mutations:
 *
 *   action: "edit-single"   — Override one specific occurrence with new data
 *   action: "edit-future"   — Split series: end old template, start new one from fromDate
 *   action: "skip-single"   — Skip (hide) one specific occurrence
 *   action: "stop"          — Stop the series from fromDate onwards
 *   action: "delete-single" — Alias for skip-single (used from delete button)
 */
export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const { action, templateId, occurrenceDate, fromDate, data } = body;

  if (!action || !templateId) {
    return NextResponse.json(
      { error: "Missing action or templateId" },
      { status: 400 },
    );
  }

  // Load the template to validate it exists
  const template = await Expense.findById(templateId);
  if (!template) {
    return NextResponse.json(
      { error: "Recurring template not found" },
      { status: 404 },
    );
  }

  // ── edit-single ──────────────────────────────────────────────────────────────
  if (action === "edit-single") {
    if (!occurrenceDate || !data) {
      return NextResponse.json(
        { error: "Missing occurrenceDate or data" },
        { status: 400 },
      );
    }
    const occDate = new Date(occurrenceDate);

    const override = await Expense.findOneAndUpdate(
      { recurringParentId: templateId, date: occDate },
      {
        ...data,
        date: occDate,
        recurringParentId: templateId,
        recurring: false,
        skipped: false,
      },
      { upsert: true, new: true, runValidators: true },
    );
    return NextResponse.json(override, { status: 200 });
  }

  // ── skip-single / delete-single ──────────────────────────────────────────────
  if (action === "skip-single" || action === "delete-single") {
    if (!occurrenceDate) {
      return NextResponse.json(
        { error: "Missing occurrenceDate" },
        { status: 400 },
      );
    }
    const occDate = new Date(occurrenceDate);

    // Check if there's an existing override for this occurrence — delete it
    await Expense.deleteOne({ recurringParentId: templateId, date: occDate });
    // Insert a skip record
    await Expense.create({
      amount: 0,
      currency: template.currency,
      category: template.category,
      date: occDate,
      recurring: false,
      recurringParentId: templateId,
      skipped: true,
    });
    return NextResponse.json({ ok: true });
  }

  // ── edit-future ──────────────────────────────────────────────────────────────
  if (action === "edit-future") {
    if (!fromDate || !data) {
      return NextResponse.json(
        { error: "Missing fromDate or data" },
        { status: 400 },
      );
    }
    const fromDateObj = new Date(fromDate);

    // Set end date on old template to one day before fromDate
    const endDate = new Date(fromDateObj);
    endDate.setDate(endDate.getDate() - 1);
    template.recurringEndDate = endDate;
    await template.save();

    // Remove any overrides/skips on the old template that are >= fromDate
    await Expense.deleteMany({
      recurringParentId: templateId,
      date: { $gte: fromDateObj },
    });

    // Create new template starting at fromDate with updated data
    const newTemplate = await Expense.create({
      ...data,
      date: fromDateObj,
      recurring: true,
    });
    return NextResponse.json(newTemplate, { status: 201 });
  }

  // ── stop ─────────────────────────────────────────────────────────────────────
  if (action === "stop") {
    if (!fromDate) {
      return NextResponse.json({ error: "Missing fromDate" }, { status: 400 });
    }
    const fromDateObj = new Date(fromDate);
    const endDate = new Date(fromDateObj);
    endDate.setDate(endDate.getDate() - 1);

    template.recurringEndDate = endDate;
    await template.save();

    // Remove any overrides/skips on the template that are >= fromDate
    await Expense.deleteMany({
      recurringParentId: templateId,
      date: { $gte: fromDateObj },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
