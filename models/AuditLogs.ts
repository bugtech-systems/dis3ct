import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
    userId: string;
    action: string;
    system: string;
    details?: string;
    timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    system: { type: Schema.Types.ObjectId, ref: "User", required: true },
    details: { type: String, required: false },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
