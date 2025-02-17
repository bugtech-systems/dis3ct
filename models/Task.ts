import mongoose, { Schema, Document } from "mongoose";

export enum TaskStatus {
  TODO = "Todo",
  IN_PROGRESS = "In Progress",
  BACKLOG = "Backlog",
  DONE = "Done",
  CANCELED = "Canceled",
}

export enum TaskPriority {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

export enum TaskCategory {
  SMS = "Sms",
  CALL = "Call",
  API = "Api",
  BACKGROUND = "Background",
}

export interface ITask extends Document {
  taskId: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  taskObject: any;
  createdAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    taskId: { type: String, required: true }, // Unique Task Identifier
    title: { type: String, required: true }, // Task Title
    category: { type: String, enum: Object.values(TaskCategory), required: true }, // Task Category
    status: { type: String, enum: Object.values(TaskStatus), required: false, default: 'Todo' }, // Task Status
    priority: { type: String, enum: Object.values(TaskPriority), required: true }, // Task Priority
    taskObject: { type: String, required: false }
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt
);

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
