// models/Resource.ts
import mongoose, { Schema, models } from 'mongoose';

const ResourceSchema = new Schema({
    type: { type: String, required: true },      // e.g., 'video', 'doc', 'pdf', 'tool'
    title: { type: String, required: true },     // Human-readable title
    name: { type: String },      // System name or key
    value: { type: String },     // URL, path, ID, or other stored value
    note: { type: String },                      // Optional notes about the resource
    createdAt: { type: Date, default: Date.now },
    system: { type: String },                      // Optional notes about the resource
});

const Resource = models.Resource || mongoose.model('Resource', ResourceSchema);
export default Resource;
