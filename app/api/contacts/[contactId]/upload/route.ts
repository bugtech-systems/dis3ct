import { NextResponse, NextRequest } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid"; // Import UUID
import Contact from "@/models/Contact";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";

export const POST = async (
    req: NextRequest,
    { params }: { params: { contactId: string } }
) => {
    try {

        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;

        // Parse the incoming form data
        const formData = await req.formData();
        const file = formData.get("file");
        const { contactId } = params;
        let authUser = await User.findById(userId);



        if (!file) {
            return NextResponse.json({ error: "No files received." }, { status: 400 });
        }


        const contact = await Contact.findById(contactId);





        if (!contact) {
            return NextResponse.json({ error: "Record not exist." }, { status: 400 });
        }




        // Convert file to a buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Get file extension
        const ext = path.extname(file.name);

        // Generate a unique filename using UUID
        const uniqueFilename = `${uuidv4()}${ext}`;

        // Define file path
        const filePath = path.join(process.cwd(), "public/assets", uniqueFilename);


        // Save file
        await writeFile(filePath, buffer);



        let newTags = contact?.tags as any[];

        newTags.push({
            tagType: 'image',
            user: authUser?._id,
            value: `/assets/${uniqueFilename}`
        })


        contact.tags = newTags;
        await contact?.save()



        return NextResponse.json({ message: "Success", contact, url: `/assets/${uniqueFilename}`, status: 201 });
    } catch (error) {
        console.error("Error occurred:", error);
        return NextResponse.json({ message: "Failed", status: 500 });
    }
};
