import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Feedback subdocument interface
interface Feedback {
    rating: number;
    correction?: string;
}

// Define the Interaction document interface
export interface IInteraction extends Document {
    contact?: string;
    inputText: string;
    detectedDialect: "waray" | "english" | "tagalog" | 'bisaya ';
    responseText: string;
    timestamp?: Date;
    feedback?: Feedback;
    system: string;
    intent?: string;
    preset: mongoose.Types.ObjectId;
    status: "pending" | "closed" | "default";

}

// Create the Interaction schema
const InteractionSchema: Schema<IInteraction> = new Schema(
    {
        contact: { type: String, require: false },
        inputText: { type: String, required: true },
        detectedDialect: { type: String, enum: ["waray", "english", "tagalog", "bisaya"], default: "english" },
        responseText: { type: String, required: true },
        intent: { type: String, required: false },
        timestamp: { type: Date, default: Date.now },
        feedback: {
            rating: { type: Number, min: 0, max: 5, default: 4 },
            correction: { type: String },
        },
        system: { type: String, required: true },
        status: { type: String, enum: ["pending", "closed", "default"], default: "pending" },
        preset: { type: Schema.Types.ObjectId, ref: 'AiPreset', required: false },

    },
    { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

// Create and export the Interaction model
const Interaction: Model<IInteraction> =
    mongoose.models.Interaction || mongoose.model<IInteraction>('Interaction', InteractionSchema);
export default Interaction;
