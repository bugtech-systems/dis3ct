// models/Mobile.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMobile extends Document {
  phone: string;
  validatedAt?: Date;
  contacts: Types.ObjectId[]; // Array of ObjectIds referencing Contact documents
}

const MobileSchema: Schema = new Schema({
  phone: { type: String, required: true, unique: true, maxlength: 20 },
  validatedAt: { type: Date },
  contacts: [{ type: Schema.Types.ObjectId, ref: 'Contact' }], // References to Contact documents
}, {timestamps: true});

export default mongoose.models.Mobile || mongoose.model<IMobile>('Mobile', MobileSchema);
