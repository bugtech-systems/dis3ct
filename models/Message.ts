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
  senderId: string;
  recipientId: string;
  message: string;
  tag?: string;
  status: MessageStatus;
  isFlash: boolean;
  messageDate: Date;
  completedDate?: Date;
  messageType: MessageType;
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: String, required: true }, // System ID
    recipientId: { type: String, required: true }, // Contact ID
    message: { type: String, required: true }, // Content of the message
    tag: { type: String }, // Optional tag
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
