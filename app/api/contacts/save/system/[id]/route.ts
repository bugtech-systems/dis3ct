import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { sanitizePhoneNumber } from "@/lib/helpers";
import Mobile from "@/models/Mobile";
import System from "@/models/System";

export const POST = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions) as any;
    const { searchParams } = new URL(req.url) as any;

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    let { id } = params;


    console.log('SEARCH', searchParams.type)

    const { phone, name, address, brgyCode, regCode, provCode, citymunCode, userLevel, system } = await req.json();





    // Find the authenticated user's contact (referrer)
    const referrer = await Contact.findOne({
      phone: sanitizePhoneNumber(session.user.phone),
      deletedAt: null
    });

    if (!referrer) {
      return NextResponse.json({ error: "Referrer contact not found." }, { status: 400 });
    }

    // Validate required fields
    const parentData = await Contact.findOne({ phone: sanitizePhoneNumber(system) });

    if (!parentData && referrer.userLevel != 'admin') {
      return NextResponse.json({ error: "System contact not found." }, { status: 400 });
    }


    // Check if contact already exists
    let existingContact = await Contact.findById(id);

    if (existingContact) {
      // Update existing contact
      existingContact.phone = sanitizePhoneNumber(phone);
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
        { message: "Contact updated successfully", contact: existingContact },
        { status: 200 }
      );
    } else {
      // Create new contact
      await Mobile.create({ phone: sanitizePhoneNumber(phone) }).catch(err => {
        console.log('Mobile Error')
      });




      const newContact = new Contact({
        phone: sanitizePhoneNumber(phone),
        // mobile: newMobile,
        name,
        address,
        ...(brgyCode ? { brgyCode } : { brgyCode: referrer.brgyCode }),
        ...(citymunCode ? { citymunCode } : { citymunCode: referrer.citymunCode }),
        ...(provCode ? { provCode } : { provCode: referrer.provCode }),
        ...(brgyCode ? { brgyCode } : { brgyCode: referrer.brgyCode }),
        parNum: parentData?.id,
        refNum: referrer.id, // Assign current user's ID as refNum
        uplines: referrer.uplines ? [...referrer.uplines, referrer.id] : [], // Add referrer's ID to uplines array
        userLevel: userLevel, // Default user level
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


export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // const userId = session.user.id;
    const { id } = params;
    const values = await req.json();

    // if (!(await isAuthorized(userId, contactId))) {
    //   return new NextResponse("Forbidden", { status: 403 });
    // }

    const updatedContact = await Contact.findByIdAndUpdate(id,
      { $set: values }
    );

    /*    if (!updatedContact.modifiedCount) {
         return new NextResponse("Contact not found or unchanged", { status: 404 });
       } */

    return NextResponse.json(updatedContact, { status: 200 });
  } catch (err) {
    console.error("Error updating contact:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};



export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const { id } = params;

    // if (!(await isAuthorized(userId, contactId))) {
    //   return new NextResponse("Forbidden", { status: 403 });
    // }


    // if (!(await isAuthorized(userId, contactId))) {
    //   return new NextResponse("Forbidden", { status: 403 });
    // }

    const updatedContact = await Contact.findByIdAndUpdate(id,
      { $set: { deletedAt: new Date } }
    );




    return new NextResponse("Contact deleted", { status: 200 });
  } catch (err) {
    console.error("Error deleting contact:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    await dbConnect();
    const { id } = params;

    const contact = await System.findOne({ number: sanitizePhoneNumber(id) });

    if (!contact) {
      return new NextResponse("System not found", { status: 404 });
    }

    return NextResponse.json(contact, { status: 200 });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
};