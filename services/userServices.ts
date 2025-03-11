import bcrypt from "bcryptjs";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import System from "@/models/System";
import { handleNewMessage, internationalizePhoneNumber, sanitizePhoneNumber } from "@/lib/helpers";
import Contact from "@/models/Contact";

export const
    registerUser = async (userData: any) => {
        await connectDB();
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        // const refNum = crypto.randomBytes(6).toString("hex").toUpperCase(); // Generate a unique ref number

        const newUser = await User.create({
            ...userData,
            password: hashedPassword,
            // refNum,
        });
        if (newUser && userData.userType == 'leader') {
            let parent = User.findById(userData.parent);
            newUser.configs = parent?.configs ? parent?.configs : [];
        }



        if (newUser && userData.userType == 'system') {
            newUser.parent = newUser._id as any;
            await System.create({
                number: userData.phone,
                port: userData.port,
                description: userData.name
            })
        }



        if (newUser && userData.contact) {
            let contact = await Contact.findById(userData?.contact);
            if (contact) {
                contact.recordType = 'leader';
            }
            contact?.save()
        }





        await newUser.save();
        return { message: "User registered successfully" };
    };

export const loginUser = async (phone: string, password: string) => {
    await connectDB();
    const user = await User.findOne({ $or: [{ phone }, { username: phone }] });
    if (!user) throw new Error("User not found");
    if (user.deletedAt) throw new Error("User is deactivated");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error("Invalid credentials");

    return user;
};

export const generateOTP = async (phone: string) => {
    await connectDB();
    const user = await User.findOne({ phone }).populate([{
        path: 'parent',
        options: { strictPopulate: false } // Allows missing `parNum` without errors
    }]);
    if (!user) throw new Error("User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(otp, 10);

    user.otp = hashedPassword;



    let resp = await handleNewMessage({
        message: `A login attempt was made to your Maretext account. If this was you, enter ${otp} to proceed.`,
        sender: internationalizePhoneNumber(phone),
        system: user?.parent?.phone
    })


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


export const updateUser = async (userId: string, data: any) => {

    try {

        await connectDB();
        let hashedPassword;
        if (data.password && String(data.password).length < 20) {
            hashedPassword = await bcrypt.hash(data.password, 10);
        }

        const user = await User.findByIdAndUpdate(userId, {
            ...data,
            ...((hashedPassword && data.password && String(data.password).length < 20) ? { password: hashedPassword } : {})
        }, {
            new: true,
            runValidators: true,
        });

        if (!user) throw new Error("User not found");
        if (user.deletedAt) throw new Error("User is deactivated");


        if (user && data.userType == 'leader') {
            let parent = User.findById(data.parent);
            user.configs = parent?.configs ? parent?.configs : [];
        }




        if (user.userType == 'system') {
            let system = await System.findOne({ number: sanitizePhoneNumber(user.phone) });
            if (system) {
                system.port = data.port ? data.port : system.port
                system.description = data.name
                await system.save()
            } else {
                await System.create({
                    number: data.phone,
                    port: data.port,
                    description: data.name
                })
            }
        }


        return user;

    } catch (err) {

        console.log(err, 'ERRR')
        return null
    }

};
