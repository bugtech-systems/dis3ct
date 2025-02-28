import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Fingerprint document interface
export interface IFCounter extends Document {
    user_id: string;
    sequence_value: number;
    lastUpdated?: Date;
}

// Create the Fingerprint schema
const CounterSchema: Schema<IFCounter> = new Schema(
    {
        user_id: { type: String, required: true },
        biometricId: { type: String, required: true, unique: true },
        templates: { type: [String], required: true, validate: (val: string[]) => val.length === 3 }, // Ensures exactly 3 templates
        enrolledAt: { type: Date, default: Date.now },
        lastUpdated: { type: Date, default: Date.now }
    },
    { timestamps: true } // Automatically manages createdAt and updatedAt fields
);

// Create and export the Fingerprint model
const Counter: Model<IFCounter> =
    mongoose.models.Counter || mongoose.model<IFCounter>('Counter', CounterSchema);
export default Counter;
