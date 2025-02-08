// pages/api/interactions.ts
import { NextRequest, NextResponse } from "next/server";
import { createInteraction, updateFeedback, getUserInteractions } from '@/services/interactionServices';

export const GET = async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        // Validate userId parameter
        if (!userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required parameter: userId',
                },
                { status: 400 }
            );
        }

        // Fetch interactions for the user
        const result = await getUserInteractions(userId);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || 'No interactions found.' },
                { status: 404 }
            );
        }

        return NextResponse.json(result.data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const result = await createInteraction(body);

        if (!result.success) {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
};

export const PUT = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { interactionId, feedback } = body;

        if (!interactionId || !feedback) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: interactionId or feedback' },
                { status: 400 }
            );
        }

        // Update feedback for the interaction
        const result = await updateFeedback(interactionId, feedback);

        if (!result.success) {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
};
