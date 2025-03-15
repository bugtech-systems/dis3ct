import { NextRequest, NextResponse } from 'next/server';
import OllamaService from '@/services/hotlineService'; // Adjust the path if needed
import { getPresetById, getPresetByValue } from '@/services/presetServices';

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { user_message, conversation_history } = body;
        let preset = null;
        if (!user_message) {
            return NextResponse.json({ error: 'User message is required' }, { status: 400 });
        }

        const presetResult = await getPresetByValue('alayon_emergency_hotline');


        if (presetResult.success) {
            preset = presetResult.data;
        }


        // Initialize OllamaService with emergency model
        const ollamaService = new OllamaService('alayon_hotline');

        // Process emergency request with AI model
        const aiResponse = await ollamaService.processEmergency(user_message, preset ? preset.systemBehavior : '', conversation_history || []);


        console.log(aiResponse, 'AI RESPONSE')
        // Validate and structure the response
        if (!aiResponse?.tags || !aiResponse?.callerMessage || !aiResponse?.report) {
            return NextResponse.json({ error: 'Invalid AI response format.' }, { status: 500 });
        }




        return NextResponse.json({
            success: true,
            tags: aiResponse.tags,
            callerMessage: aiResponse.callerMessage,
            report: aiResponse.report,
        });
    } catch (error) {
        console.error('Error processing emergency request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
