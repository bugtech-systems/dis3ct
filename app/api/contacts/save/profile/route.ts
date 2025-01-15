import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { sanitizePhoneNumber } from "@/lib/helpers";
import Mobile from "@/models/Mobile";

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

    const { phone, name, address, brgyCode, regCode, provCode, citymunCode, userLevel } = await req.json();

    // Validate required fields
    if (!phone) {
      return NextResponse.json({ error: "Phone and Name are required." }, { status: 400 });
    }



    // Check if contact already exists
    let existingContact = await Contact.findById(session.user.id);

    if (existingContact) {
      // Update existing contact
      existingContact.name = name;
      existingContact.address = address;
      existingContact.brgyCode = brgyCode;
      existingContact.regCode = regCode;
      existingContact.provCode = provCode;
      existingContact.citymunCode = citymunCode;
      // existingContact.userLevel = userLevel;      // existingContact.refNum = referrer.id; // Update referrer
      // existingContact.uplines = existingContact.uplines ? [...existingContact.uplines, referrer.id] : []; // Maintain unique uplines

      await existingContact.save();

      return NextResponse.json(
        { message: "Profile updated successfully", contact: existingContact },
        { status: 200 }
      );
    } else {
      // Create new contact

      return NextResponse.json(
        { message: "Profile not Found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
