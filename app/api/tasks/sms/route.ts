import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Task from "@/models/Task";
import { v4 as uuidv4 } from "uuid";

// Ensure DB Connection
import connectDB from "@/lib/mongodb";
import { internationalizePhoneNumber, sanitizePhoneNumber } from "@/lib/helpers";

export const POST = async (req: NextRequest) => {
  try {
    await connectDB(); // Connect to MongoDB

    const { recipients, message, isFlash } = await req.json();

    if (!recipients || !message || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: "Invalid request. Provide recipients, message, and isFlash." },
        { status: 400 }
      );
    }

    // Prepare task objects for each recipient
    const tasks = recipients.map((phone) => ({
      taskId: `TASK-${uuidv4().slice(0, 8).toUpperCase()}`,
      title: "Send SMS",
      category: "Sms",
      status: "Todo",
      priority: "Medium",
      taskObject: JSON.stringify({
        phone: internationalizePhoneNumber(phone),
        message,
        isFlash: isFlash || false,
      }),
    }));

    // Insert tasks into MongoDB
    await Task.insertMany(tasks);

    return NextResponse.json(
      { message: "Tasks created successfully!", tasks },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving tasks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
