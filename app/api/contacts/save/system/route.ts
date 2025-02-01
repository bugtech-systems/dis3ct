import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { sanitizePhoneNumber } from "@/lib/helpers";
import Mobile from "@/models/Mobile";
import System from "@/models/System";

export const POST = async (req: NextRequest) => {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as any;
    const { searchParams } = new URL(req.url) as any;

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }



    console.log('SEARCH', searchParams.type)

    const { phone, port, description } = await req.json();

    // Validate required fields
    if (!phone) {
      return NextResponse.json({ error: "Phone and Name are required." }, { status: 400 });
    }


    // Check if contact already exists
    let existingContact = await System.findOne({
      number: sanitizePhoneNumber(phone)
    });

    if (existingContact) {
      // Update existing contact
      existingContact.port = port;
      existingContact.description = description;


      // existingContact.uplines = existingContact.uplines ? [...existingContact.uplines, referrer.id] : []; // Maintain unique uplines

      await existingContact.save();

      return NextResponse.json(
        { message: "Contact updated successfully", contact: existingContact },
        { status: 200 }
      );
    } else {
      // Create new contact

      const newContact = new System({
        number: sanitizePhoneNumber(phone),
        port,
        description
      });


      await newContact.save();

      return NextResponse.json(
        { message: "Contact saved successfully", contact: newContact },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error saving contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
