import { NextRequest, NextResponse } from "next/server";
import Task from "@/models/Task";
import dbConnect from "@/lib/mongodb";


export const POST = async (
  req: NextRequest,
  { params }: { params: { taskId: string } }

) => {
  try {
    await dbConnect();
    const { taskId } = params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");




    const task = await Task.findById(taskId);
    if (!task) {
      return new NextResponse("Task not found", { status: 404 });
    }


    task.status = status;
    task.save()

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.log("Error fetching system:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch system" },
      { status: 500 }
    );
  }
};