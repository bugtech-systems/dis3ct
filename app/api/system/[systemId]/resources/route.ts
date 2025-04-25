// app/api/resources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Resource from '@/models/Resource';
import dbConnect from "@/lib/mongodb";
import { sanitizePhoneNumber } from '@/lib/helpers';
import User from '@/models/User';

// GET all resources
export async function GET(
    req: NextRequest,
    { params }: { params: { systemId: string } }
) {
    try {
        const { systemId } = params;

        const system = await User.findOne({ phone: sanitizePhoneNumber(systemId), userType: 'system' });
        if (!system) {
            return new NextResponse("System not found", { status: 404 });
        }

        const resources = await Resource.find({ system: sanitizePhoneNumber(systemId) });
        return NextResponse.json(resources, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST a new resource
export async function POST(
    req: NextRequest,
    { params }: { params: { systemId: string } }
) {
    try {
        const { systemId } = params;

        const system = await User.findOne({ phone: sanitizePhoneNumber(systemId), userType: 'system' });
        if (!system) {
            return new NextResponse("System not found", { status: 404 });
        }

        const body = await req.json();

        const { type, title, name, value, note } = body;

        if (!title || !type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: title' },
                { status: 400 }
            );
        }

        const resource = await Resource.create({ type, title, name, value, note, system: sanitizePhoneNumber(systemId) });
        return NextResponse.json({ success: true, data: resource }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// PUT to update a resource by ID
export async function PUT(
    req: NextRequest,
    { params }: { params: { systemId: string } }
) {
    try {

        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required for update' }, { status: 400 });
        }

        const updatedResource = await Resource.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedResource) {
            return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedResource });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { systemId: string } }
) {
    try {
        const { systemId } = params;
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');


        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required for delete' }, { status: 400 });
        }

        const updatedResource = await Resource.deleteOne({ _id: id, system: sanitizePhoneNumber(systemId) });

        if (!updatedResource) {
            return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Resources Deleted!' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

