import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    phone: string;
    username: string;
    password: string;
    otp?: string;
    recoveryCode?: string;
    contact?: string;
    userType: "admin" | "system" | "leader";
    accessLevel: "regCode" | "provCode" | "citymunCode" | "brgyCode";
    accessCode?: string;
    deletedAt?: Date | null;
    parent?: Schema.Types.ObjectId;
    refNum?: string;
    configs: { value: string; title: string }[];
}

const UserSchema: Schema = new Schema(
    {
        phone: { type: String, required: true },
        name: { type: String, required: false },
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        otp: { type: String, default: null },
        recoveryCode: { type: String, default: null },
        contact: { type: Schema.Types.ObjectId, ref: "Contact", default: null },
        userType: { type: String, enum: ["admin", "system", "leader"], required: true, default: "leader" },
        deletedAt: { type: Date, default: null },
        parent: { type: Schema.Types.ObjectId, ref: "User", default: null },
        refNum: { type: String },
        accessLevel: {
            type: String,
            enum: ['regCode', 'provCode', 'citymunCode', 'brgyCode'],
            default: 'brgyCode',
        },
        accessCode: { type: String, default: null },
        configs: [{ value: Boolean, title: String }],
    },
    { timestamps: true }
);

// export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
const User = (mongoose.models && mongoose.models.User)
    ? (mongoose.models.User as Model<IUser>)
    : mongoose.model<IUser>('User', UserSchema);

export default User;