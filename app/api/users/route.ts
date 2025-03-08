import { NextRequest, NextResponse } from "next/server";
import { registerUser, loginUser, generateOTP, verifyOTP, resetPassword, updateUser } from "@/services/userServices";
import getTeams from "@/actions/getTeams";

export async function POST(req: NextRequest) {
    const { action, userId, ...data } = await req.json();

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
            case "update":
                return NextResponse.json(await updateUser(userId, data));
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error: any) {
        console.log(error, 'EERR')
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get("userId") || "";

    const result = await getTeams(user);



    if (!result) {
        return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result, { status: 200 });
};