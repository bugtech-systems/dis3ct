import mongoose, { Schema, Document } from "mongoose";

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  PENDING = "pending",
}

export enum MessageType {
  INCOMING = "incoming",
  OUTGOING = "outgoing",
}

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  message: string;
  tag?: string;
  group: string; 
  status: MessageStatus;
  isFlash: boolean;
  messageDate: Date;
  completedDate?: Date;
  messageType: MessageType;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'Mobile', required: true }, // System ID
    recipient: { type: Schema.Types.ObjectId, ref: 'Mobile', required: true }, // Contact ID
    message: { type: String, required: true }, // Content of the message
    tag: { type: String }, // Optional tag
    group: { type: String }, // Optional tag
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.PENDING,
    },
    isFlash: { type: Boolean, default: false },
    messageDate: { type: Date, default: Date.now },
    completedDate: { type: Date },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.INCOMING,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
