import { NextRequest, NextResponse } from "next/server";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "@/services/taskServices";
import { v4 as uuidv4 } from "uuid";

// Get all tasks or a single task by ID
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("id");

    if (taskId) {
      const result = await getTaskById(taskId);
      if (!result.success) {
        return NextResponse.json(result, { status: 404 });
      }
      return NextResponse.json(result);
    }

    const result = await getTasks();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
};

// Create a new task
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    
    let newObject = {...body,
      taskId: `TASK-${uuidv4().slice(0, 8).toUpperCase()}`,
    };
    
    const result = await createTask(newObject);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
};

// Update a task
export const PUT = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("id");
    const status = searchParams.get("status");

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const result = await updateTask(taskId, body, status || "");
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
};

// Delete a task
export const DELETE = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("id");

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteTask(taskId);
    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
};
