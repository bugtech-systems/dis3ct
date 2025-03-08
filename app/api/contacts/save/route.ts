import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { sanitizePhoneNumber } from "@/lib/helpers";
import Mobile from "@/models/Mobile";
import bcrypt from 'bcryptjs';

export const POST = async (req: NextRequest) => {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as any;
    const { searchParams } = new URL(req.url) as any;

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }




    const { phone, name, address, brgyCode, regCode, provCode, citymunCode, userLevel, system, pinCode, username } = await req.json();

    // Validate required fields
    if (!phone && !name) {
      return NextResponse.json({ error: "Phone and Name are required." }, { status: 400 });
    }

    const parentData = await Contact.findOne({ phone: sanitizePhoneNumber(system) });

    if (!parentData) {
      return NextResponse.json({ error: "System contact not found." }, { status: 400 });
    }


    // Find the authenticated user's contact (referrer)
    const referrer = await Contact.findOne({ phone: sanitizePhoneNumber(session.user.phone) });

    if (!referrer) {
      return NextResponse.json({ error: "Referrer contact not found." }, { status: 400 });
    }

    // Check if contact already exists
    let existingContact = await Contact.findOne({
      phone: sanitizePhoneNumber(phone), refNum: referrer.id
    });

    if (existingContact) {
      // Update existing contact
      existingContact.phone = sanitizePhoneNumber(phone);
      existingContact.name = name;
      existingContact.address = address ?? existingContact.address;
      existingContact.brgyCode = brgyCode ?? existingContact.brgyCode;
      existingContact.regCode = regCode ?? existingContact.regCode;
      existingContact.provCode = provCode ?? existingContact.provCode;
      existingContact.citymunCode = citymunCode ?? existingContact.citymunCode;
      existingContact.pinCode = pinCode ? await bcrypt.hash(pinCode, 10) : existingContact.pinCode;      // existingContact.refNum = referrer.id; // Update referrer
      existingContact.userLevel = userLevel ?? existingContact.userLevel;      // existingContact.refNum = referrer.id; // Update referrer
      // existingContact.uplines = existingContact.uplines ? [...existingContact.uplines, referrer.id] : []; // Maintain unique uplines

      await existingContact.save();

      return NextResponse.json(
        { message: "Contact updated successfully", contact: existingContact },
        { status: 200 }
      );
    } else {
      // Create new contact
      await Mobile.create({ phone: sanitizePhoneNumber(phone) }).catch(err => {
        console.log('Mobile Error')
      });



      const newContact = new Contact({
        ...(brgyCode ? { brgyCode } : { brgyCode: referrer.brgyCode }),
        ...(citymunCode ? { citymunCode } : { citymunCode: referrer.citymunCode }),
        ...(provCode ? { provCode } : { provCode: referrer.provCode }),
        ...(brgyCode ? { brgyCode } : { brgyCode: referrer.brgyCode }),
        phone: sanitizePhoneNumber(phone),
        // mobile: newMobile,
        name,
        address,
        // parNum: referrer.parNum,
        refNum: referrer.id, // Assign current user's ID as refNum
        uplines: referrer.uplines ? [...referrer.uplines, referrer.id] : [], // Add referrer's ID to uplines array
        userLevel: userLevel, // Default user level,
        parNum: parentData?.id,
        pinCode: await bcrypt.hash(pinCode, 10)

      });

      newContact.parNum = userLevel == 'system' ? newContact.id : referrer.parNum
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
