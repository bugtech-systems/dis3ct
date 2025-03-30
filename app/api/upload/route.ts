import { NextResponse, NextRequest } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid"; // Import UUID

export const POST = async (req) => {
    try {
        // Parse the incoming form data
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No files received." }, { status: 400 });
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

        return NextResponse.json({ message: "Success", url: `/assets/${uniqueFilename}`, status: 201 });
    } catch (error) {
        console.error("Error occurred:", error);
        return NextResponse.json({ message: "Failed", status: 500 });
    }
};
