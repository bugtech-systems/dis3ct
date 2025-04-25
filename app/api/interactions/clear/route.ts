// pages/api/interactions.ts
import { NextRequest, NextResponse } from "next/server";
import { createInteraction, updateFeedback, getUserInteractions, clearInteraction } from '@/services/interactionServices';

export const GET = async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const system = searchParams.get('system');
        const phone = searchParams.get('phone');

        // Validate userId parameter
        if (!system) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required parameter: system',
                },
                { status: 400 }
            );
        }


        // Fetch interactions for the user
        await clearInteraction(phone, system);


        return NextResponse.json({ message: 'Conversation cleared!' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
};
