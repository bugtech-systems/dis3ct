import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Task from "@/models/Task";
import { v4 as uuidv4 } from "uuid";

// Ensure DB Connection
import connectDB from "@/lib/mongodb";
import { internationalizePhoneNumber } from "@/lib/helpers";

export const POST = async (req: NextRequest) => {
    try {
        await connectDB(); // Connect to MongoDB

        const { recipients, messages, isFlash = false, system } = await req.json();
        console.log(recipients, messages, isFlash, 'SMS')
        if (!Array.isArray(recipients) || !Array.isArray(messages) || recipients.length === 0 || messages.length === 0) {
            return NextResponse.json(
                { error: "Invalid request. Provide a valid array of recipients and messages." },
                { status: 400 }
            );
        }

        // Generate tasks for each recipient and each message
        const tasks = recipients.flatMap((phone) =>
            messages.map((message) => ({
                taskId: `TASK-${uuidv4().slice(0, 8).toUpperCase()}`,
                title: "Send SMS",
                category: "Sms",
                status: "Todo",
                priority: "Medium",
                system,
                taskObject: JSON.stringify({
                    phone: internationalizePhoneNumber(phone),
                    message,
                    isFlash,
                    system
                }),
            }))
        );

        // Insert tasks into MongoDB
        await Task.insertMany(tasks);

        return NextResponse.json(
            { message: "Tasks created successfully!", taskCount: tasks.length },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error saving tasks:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
