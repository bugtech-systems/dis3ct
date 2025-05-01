// app/api/read-pdf/route.js
import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await pdf(buffer);

        return NextResponse.json({
            success: true,
            text: data.text,
            numPages: data.numpages,
            info: data.info,
        });
    } catch (error) {
        console.error('PDF parse error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
