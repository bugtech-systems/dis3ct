import { NextRequest, NextResponse } from "next/server";
import { registerUser, loginUser, generateOTP, verifyOTP, resetPassword } from "@/services/userServices";

export async function POST(req: NextRequest) {
    const { action, ...data } = await req.json();

    try {
        switch (action) {
            case "register":
                return NextResponse.json(await registerUser(data));
            case "login":
                return NextResponse.json(await loginUser(data.phone, data.password));
            case "generate-otp":
                return NextResponse.json(await generateOTP(data.phone));
            case "verify-otp":
                return NextResponse.json(await verifyOTP(data.phone, data.otp));
            case "reset-password":
                return NextResponse.json(await resetPassword(data.phone, data.newPassword));
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        console.log(error, 'EERR')
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
