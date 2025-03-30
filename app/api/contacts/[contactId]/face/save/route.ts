import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";
import User from "@/models/User";

export async function POST(
    req: NextRequest,
    { params }: { params: { contactId: string } }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;
        const { contactId } = params;
        const { descriptor, imgUrl } = await req.json();

        if (!descriptor) {
            return NextResponse.json({ error: "No face detected" }, { status: 400 });
        }

        let authUser = await User.findById(userId);


        const float32Array = new Float32Array(Object.values(descriptor));

        // Convert Float32Array to regular array
        const descriptorArray = Array.from(float32Array);


        const contact = await Contact.findById(contactId);

        if (!contact) {
            return NextResponse.json({ error: "Record not exist." }, { status: 400 });
        }

        contact.descriptor = descriptorArray;

        let newTags = contact?.tags as any[];

        newTags.push({
            tagType: 'image',
            user: authUser?._id,
            value: imgUrl
        })


        contact.tags = newTags;
        await contact?.save()

        return NextResponse.json({ message: "Face saved successfully", contact });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
