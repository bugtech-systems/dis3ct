// models/Contact.ts
import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// // Check if the Mongoose connection is initialized
// if (!mongoose.connection.readyState) {
//   throw new Error('Mongoose connection is not established.');
// }

// Define Contact Interface
export interface IContact extends Document {
  mobile: Types.ObjectId; // Reference to the associated Mobile document
  phone: string;
  name?: string;
  address?: string;
  subscribed?: boolean;
  createdAt: Date;
  deletedAt?: Date;
  brgyCode?: string;
  regCode?: string;
  provCode?: string;
  citymunCode?: string;
  activePreset?: string;
  otpCode?: string;
  refNum?: Types.ObjectId;
  parNum?: Types.ObjectId;
  uplines?: Types.ObjectId[]; // Array of ObjectIds referencing Contact documents
  otpExpiresAt?: Date;
  userLevel: 'regional' | 'provincial' | 'municipal' | 'barangay' | 'admin' | 'normal' | 'system' | 'rider';
  coordinates: any;
  subscription: 'basic' | 'pro' | 'cancelled';
  isDeleted: boolean;
}

const ContactSchema = new Schema<IContact>(
  {
    // mobile: { type: Schema.Types.ObjectId, ref: 'Mobile', required: true }, // Reference to Mobile document
    phone: { type: String, maxlength: 20 },
    name: { type: String },
    address: { type: String, required: false },
    subscribed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
    brgyCode: { type: String, maxlength: 255 },
    regCode: { type: String, maxlength: 255 },
    provCode: { type: String, maxlength: 255 },
    citymunCode: { type: String, maxlength: 255 },
    activePreset: { type: String, maxlength: 255 },
    otpCode: { type: String },
    refNum: { type: Schema.Types.ObjectId, ref: 'Contact' },
    parNum: { type: Schema.Types.ObjectId, ref: 'Contact' },
    uplines: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    userLevel: {
      type: String,
      enum: ['regional', 'provincial', 'municipal', 'barangay', 'admin', 'system', 'normal', 'rider'],
      default: 'normal',
    },
    coordinates: {
      latitude: String,
      longitude: String
    },
    subscription: {
      type: String,
      enum: ['basic', 'pro', 'cancelled'],
      default: 'basic',
    },
    otpExpiresAt: { type: Date, required: false },
  }, { timestamps: true });

const Contact = (mongoose.models && mongoose.models.Contact)
  ? (mongoose.models.Contact as Model<IContact>)
  : mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;