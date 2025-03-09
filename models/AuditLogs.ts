import mongoose, { Schema, Document, models } from "mongoose";

export interface IAuditLog extends Document {
    userId: string;
    action: string;
    system: string;
    details?: string;
    timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    system: { type: Schema.Types.ObjectId, ref: "User" },
    details: { type: String, required: false },
    timestamp: { type: Date, default: Date.now },
});

// Prevent model overwrite error
export default models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
