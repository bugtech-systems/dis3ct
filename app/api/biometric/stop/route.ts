import { NextRequest, NextResponse } from "next/server";
import { stopBiometricService } from "@/services/biometricService";

export const POST = async (req: NextRequest) => {
    try {
        const response = stopBiometricService();
        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.log(error, 'ERROR')
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
};
