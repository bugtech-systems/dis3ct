import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import crypto from "crypto";

export const
    registerUser = async (userData: any) => {
        await connectDB();
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        // const refNum = crypto.randomBytes(6).toString("hex").toUpperCase(); // Generate a unique ref number

        const newUser = new User({
            ...userData,
            password: hashedPassword,
            // refNum,
        });

        if (userData.userType == 'system') {
            newUser.parent = newUser._id;
        }

        await newUser.save();
        return { message: "User registered successfully" };
    };

export const loginUser = async (phone: string, password: string) => {
    await connectDB();
    const user = await User.findOne({ $or: [{ phone }, { username: phone }] });
    console.log(user, 'LOGIN')
    if (!user) throw new Error("User not found");
    if (user.deletedAt) throw new Error("User is deactivated");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error("Invalid credentials");

    return user;
};

export const generateOTP = async (phone: string) => {
    await connectDB();
    const user = await User.findOne({ phone });
    if (!user) throw new Error("User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    await user.save();

    return { message: "OTP generated", otp }; // In production, send via SMS
};

export const verifyOTP = async (phone: string, otp: string) => {
    await connectDB();
    const user = await User.findOne({ phone, otp });

    if (!user) throw new Error("Invalid OTP");
    user.otp = null;
    await user.save();

    return { message: "OTP verified successfully" };
};

export const resetPassword = async (phone: string, newPassword: string) => {
    await connectDB();
    const user = await User.findOne({ phone });

    if (!user) throw new Error("User not found");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.recoveryCode = null;
    await user.save();

    return { message: "Password reset successfully" };
};
