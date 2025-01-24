import dbConnect from "@/lib/mongodb";
import Task, { ITask } from "@/models/Task";

// Create a new task
export const createTask = async (data: Partial<ITask>) => {
  try {
    await dbConnect();
    const newTask = new Task(data);
    const savedTask = await newTask.save();
    return { success: true, data: savedTask };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create task" };
  }
};

// Get all tasks
export const getTasks = async () => {
  try {
    await dbConnect();
    const tasks = await Task.find();
    return { success: true, data: tasks };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch tasks" };
  }
};

// Get a task by ID
export const getTaskById = async (id: string) => {
  try {
    await dbConnect();
    const task = await Task.findById(id);
    if (!task) {
      return { success: false, error: "Task not found" };
    }
    return { success: true, data: task };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch task" };
  }
};

// Update a task
export const updateTask = async (id: string, data: Partial<any>, status?: string) => {
  try {
    await dbConnect();
    const updatedTask = await Task.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!updatedTask) {
      return { success: false, error: "Task not found" };
    }
    
    console.log(status, 'STATUS')
    return { success: true, data: updatedTask };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update task" };
  }
};

// Delete a task
export const deleteTask = async (id: string) => {
  try {
    await dbConnect();
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return { success: false, error: "Task not found" };
    }
    return { success: true, data: deletedTask };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete task" };
  }
};
