import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
  id: string;
  role: "user" | "system" | "assistant";
  position: number;
  content: string;
  status: "pending" | "active" | "closed";
  contact: mongoose.Types.ObjectId;
  system: mongoose.Types.ObjectId;
  preset:  mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId() },
    role: { type: String, enum: ["user", "system", "assistant"], default: "user" },
    position: { type: Number },
    preset: { type: Schema.Types.ObjectId, ref: 'AiPreset', required: false },
    content: { type: String, required: true },
    status: { type: String, enum: ["pending", "active", "closed"], default: "pending" },
    contact:  { type: Schema.Types.ObjectId, ref: 'Contact', required: false },
    system:  { type: Schema.Types.ObjectId, ref: 'Contact', required: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);  

export default (mongoose.models.Conversation as Model<IConversation>) ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
