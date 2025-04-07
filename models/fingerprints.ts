import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Fingerprint document interface
export interface IFingerprint extends Document {
    user_id: string;
    biometricId: Number;
    templates?: string[]; // Hex-encoded fingerprint templates
    enrolledAt?: Date;
    image_path?: string,
    lastUpdated?: Date;
}

// Create the Fingerprint schema
const FingerprintSchema: Schema<IFingerprint> = new Schema(
    {
        user_id: { type: String, required: true, unique: true },
        biometricId: { type: Number, required: true, unique: true },
        templates: { type: [String], validate: (val: string[]) => val.length === 3 }, // Ensures exactly 3 templates
        enrolledAt: { type: Date, default: Date.now },
        image_path: { type: String, required: false },
        lastUpdated: { type: Date, default: Date.now }
    },
    { timestamps: true } // Automatically manages createdAt and updatedAt fields
);

// Create and export the Fingerprint model
const Fingerprint: Model<IFingerprint> =
    mongoose.models.Fingerprint || mongoose.model<IFingerprint>('Fingerprint', FingerprintSchema);
export default Fingerprint;
