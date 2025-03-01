// models/Contact.ts
import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// // Check if the Mongoose connection is initialized
// if (!mongoose.connection.readyState) {
//   throw new Error('Mongoose connection is not established.');
// }

// Define Contact Interface
export interface IContact extends Document {
  phone?: string;
  precinct?: string;
  marker?: string;
  idNum?: string;
  name?: string;
  address?: string;
  subscribed?: boolean;
  createdAt: Date;
  deletedAt?: Date;
  brgyCode?: string;
  regCode?: string;
  provCode?: string;
  citymunCode?: string;
  school?: string;
  activePreset?: string;
  refNum?: Types.ObjectId;
  parNum?: Types.ObjectId;
  biometric?: Types.ObjectId;
  uplines?: Types.ObjectId[]; // Array of ObjectIds referencing Contact documents
  otpExpiresAt?: Date;
  recordType: 'contact' | 'master_list' | 'hotline';
  coordinates: any;
  isDeleted: boolean;
}

const ContactSchema = new Schema<IContact>(
  {
    // mobile: { type: Schema.Types.ObjectId, ref: 'Mobile', required: true }, // Reference to Mobile document
    phone: { type: String, maxlength: 20, required: false },
    precinct: { type: String, required: false },
    marker: { type: String, required: false },
    idNum: { type: Number, required: false },
    name: { type: String },
    address: { type: String, required: false },
    school: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
    brgyCode: { type: String, maxlength: 255 },
    regCode: { type: String, maxlength: 255 },
    provCode: { type: String, maxlength: 255 },
    citymunCode: { type: String, maxlength: 255 },
    activePreset: { type: String, maxlength: 255 },
    biometric: { type: Schema.Types.ObjectId, ref: 'Fingerprint' },
    subscribed: { type: Boolean, default: false },
    parNum: { type: Schema.Types.ObjectId, ref: 'User' },
    refNum: { type: Schema.Types.ObjectId, ref: 'User' },
    uplines: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    recordType: {
      type: String,
      enum: ['contact', 'master_list', 'hotline'],
      default: 'contact',
    },
    coordinates: {
      latitude: String,
      longitude: String
    },
  }, { timestamps: true });


ContactSchema.index({ idNum: 1 });
ContactSchema.index({ name: 1 });
ContactSchema.index({ refNum: 1 });


const Contact = (mongoose.models && mongoose.models.Contact)
  ? (mongoose.models.Contact as Model<IContact>)
  : mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;