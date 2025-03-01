import { NextRequest, NextResponse } from "next/server";
import { startBiometricService } from "@/services/biometricService";

export const POST = async (req: NextRequest) => {
    try {
        const response = startBiometricService();
        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
};
