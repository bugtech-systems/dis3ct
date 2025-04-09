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
  descriptor?: Number[];
  tags?: any[];
  recordType: 'contact' | 'master_list' | 'hotline' | 'leader' | 'subscriber';
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
    tags: [{
      tagType: { type: String, default: 'tag' },
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      value: String,
      note: String,
      title: String,
      isTrue: { type: Boolean, default: false },
      timestamp: { type: Date, default: Date.now },
    }],
    parNum: { type: Schema.Types.ObjectId, ref: 'User' },
    refNum: { type: Schema.Types.ObjectId, ref: 'User' },
    uplines: [{ type: Schema.Types.ObjectId, ref: 'Contact' }],
    descriptor: { type: [Number], required: false },
    recordType: {
      type: String,
      enum: ['contact', 'subscriber', 'master_list', 'hotline', 'leader'],
      default: 'contact',
    },
    coordinates: {
      latitude: String,
      longitude: String
    },
  }, { timestamps: true });


ContactSchema.index({ refNum: 1 });
ContactSchema.index({ parNum: 1 });
ContactSchema.index({ brgyCode: 1 });
ContactSchema.index({ name: 1 });
ContactSchema.index({ phone: 1 });
ContactSchema.index({ address: 1 });
ContactSchema.index({ marker: 1 });
ContactSchema.index({ precinct: 1 });
ContactSchema.index({ username: 1 });
ContactSchema.index({ descriptor: 1 });
ContactSchema.index({ "tags.timestamp": -1 });



const Contact = (mongoose.models && mongoose.models.Contact)
  ? (mongoose.models.Contact as Model<IContact>)
  : mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;