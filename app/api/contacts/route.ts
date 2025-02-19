import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";
// import { withAuth } from '@/lib/withAuth';

const convertToAndCondition = (option: any) => {
  if (!option || typeof option !== "object") {
    throw new Error("Invalid option provided. Must be an object.");
  }

  let options = [] as any;
  Object.entries(option).map(([key, value]) => {
    if (value && value != 'undefined')
      options.push({ [key]: value })
  })
  // Convert each key-value pair to a separate condition in the $and array
  return {
    $and: options
  };
};


export const POST = async (req: NextRequest) => {

  try {

    const data = await req.json()

    if (!data?.phone) return new NextResponse("Not Found", { status: 404 })

    let { phone, system, referrer, userLevel, username, pinCode } = data;

    let newPhone = sanitizePhoneNumber(data?.phone);


    await connectToDatabase();




    const parentData = await Contact.findOne({ phone: sanitizePhoneNumber(system) });

    // if (!parentData) {
    //   return NextResponse.json({ error: "System contact not found." }, { status: 400 });
    // }



    let refData = await Contact.findOne({ phone: sanitizePhoneNumber(referrer), parNum: parentData?._id }) as any;


    if (!refData) {
      refData = parentData;
      // return NextResponse.json({ error: "Referrer contact not found." }, { status: 400 });
    }


    let contact = await Contact.findOne({ phone: sanitizePhoneNumber(phone), parNum: parentData?._id })

    if (!contact) {
      contact = new Contact({
        phone: sanitizePhoneNumber(phone),
        refNum: refData?.id,
        parNum: parentData?.id,
        // ...(refData ? { brgyCode: refData.brgyCode } : { brgyCode: parentData.brgyCode }),
        // ...(refData ? { citymunCode: refData.citymunCode } : { citymunCode: parentData.citymunCode }),
        ...(refData ? { provCode: refData.provCode } : { provCode: parentData.provCode }),
        ...(refData ? { regCode: refData.regCode } : { regCode: parentData.regCode }),
      })
    }


    let refExist = contact?.uplines?.find(contact => String(contact) == String(refData?._id))

    console.log(refExist, refData._id, 'REFEX')

    if (!refExist && refData._id) {
      contact?.uplines?.push(refData._id)
    } else {
      return NextResponse.json({ error: "Contact already exist." }, { status: 200 });
    }

    const newMobile = new Mobile({ phone: newPhone });


    const savedContact = await contact.save();



    return NextResponse.json(savedContact, { status: 201 });

  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }

}



export async function GET(req: NextRequest) {
  try {
    await connectToDatabase(); // Ensure MongoDB connection

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const system = searchParams.get("system");

    const skip = (page - 1) * limit;

    // Construct query filters
    const filters: any = {};

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { precinct: { $regex: search, $options: "i" } },
        { marker: { $regex: search, $options: "i" } },
      ];
    }

    if (system) {
      filters.parNum = system; // Ensure this matches your schema
    }

    // Query contacts with pagination
    const contacts = await Contact.find(filters)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by latest

    // Count total matching documents
    const totalContacts = await Contact.countDocuments(filters);

    return NextResponse.json(
      {
        data: contacts,
        pagination: {
          total: totalContacts,
          page,
          limit,
          totalPages: Math.ceil(totalContacts / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CONTACTS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}



