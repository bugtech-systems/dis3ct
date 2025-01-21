import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAiPreset extends Document {
  name: string;
  value: string;
  description?: string;
  systemBehavior: string;
  sampleConversation?: mongoose.Types.ObjectId[]; // Array of references to Conversation
  contact?: mongoose.Types.ObjectId;
  modelName: string;
  aiTemperature: number;
  aiMaxLength: number;
  aiTopP: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiPresetSchema: Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    description: { type: String },
    systemBehavior: { type: String, required: true },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact", // Reference to the Conversation model,
      required: false
    },
    sampleConversation: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation", // Reference to the Conversation model
      },
    ],
    modelName: { type: String, required: false },
    aiTemperature: { type: Number, required: false },
    aiMaxLength: { type: Number, required: false },
    aiTopP: { type: Number, required: false },
  },
  { timestamps: true }
);

export default (mongoose.models.AiPreset as Model<IAiPreset>) ||
  mongoose.model<IAiPreset>("AiPreset", AiPresetSchema);
