import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";

export const GET = async (req: NextRequest) => {
  try {
    await dbConnect();
    const tasks = await Task.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: tasks }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 });
  }
};


export const POST = async (req: NextRequest) => {
    try {
      await dbConnect();
      const { taskId, title, category, status, priority, taskObject } = await req.json();
  
      const task = new Task({ taskId, title, category, status, priority, taskObject: JSON.stringify(taskObject) });
      await task.save();
  
      return NextResponse.json({ success: true, data: task }, { status: 201 });
    } catch (error) {
    console.log(error)
      return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 });
    }
  };
  
  
  export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      await dbConnect();
      const { id } = params;
      const updateData = await req.json();
  
      const task = await Task.findByIdAndUpdate(id, updateData, { new: true });
  
      if (!task) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  
      return NextResponse.json({ success: true, data: task }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
    }
  };
  