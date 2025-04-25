// models/Mobile.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMobile extends Document {
  phone: string;
  validatedAt?: Date;
  contact?: Types.ObjectId; // Array of ObjectIds referencing Contact documents
  subscribedAt?: Date;
  system: string; // Array of ObjectIds referencing Contact documents
  activeIntent?: string; // Array of ObjectIds referencing Contact documents

}

const MobileSchema: Schema = new Schema({
  phone: { type: String, required: true, maxlength: 20 },
  validatedAt: { type: Date },
  contact: { type: Schema.Types.ObjectId, ref: 'Contact' }, // References to Contact documents
  system: { type: String, required: true }, // References to Contact documents,
  activeIntent: { type: String, required: false }, // References to Contact documents,
  subscribedAt: { type: Date },

}, { timestamps: true });

export default mongoose.models.Mobile || mongoose.model<IMobile>('Mobile', MobileSchema);
