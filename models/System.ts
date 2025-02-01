import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystem extends Document {
  number: string;
  totalSent: number;
  totalFailed: number;
  port: string;
  credits: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

const SystemSchema: Schema = new mongoose.Schema(
  {
    number: { type: String, required: true, maxlength: 15 },
    totalSent: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    port: { type: String, required: true, maxlength: 10 },
    credits: { type: Number, default: 0.0 },
    description: { type: String, maxlength: 255 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }

  },
  { timestamps: true }
);

export default (mongoose.models.System as Model<ISystem>) ||
  mongoose.model<ISystem>("System", SystemSchema);
