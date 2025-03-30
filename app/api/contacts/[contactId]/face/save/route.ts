import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";

export async function POST(
    req: NextRequest,
    { params }: { params: { contactId: string } }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;
        const { contactId } = params;
        const { descriptor } = await req.json();

        if (!descriptor) {
            return NextResponse.json({ error: "No face detected" }, { status: 400 });
        }
        console.log(descriptor, 'DESC')

        const float32Array = new Float32Array(Object.values(descriptor));

        // Convert Float32Array to regular array
        const descriptorArray = Array.from(float32Array);


        await dbConnect();
        await Contact.findByIdAndUpdate(
            contactId,
            { descriptor: descriptorArray },
            { upsert: true }
        );

        return NextResponse.json({ message: "Face saved successfully", descriptor });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
