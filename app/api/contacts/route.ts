import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";
import { barangays, regions, provinces, municipalities } from "@/lib/locationData";
import User from "@/models/User";

// import { withAuth } from '@/lib/withAuth';

function objectToString(obj: any, separator = " ") {
  return Object.values(obj).join(separator);
}


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
        ...(refData ? { provCode: refData.provCode } : { provCode: parentData?.provCode }),
        ...(refData ? { regCode: refData.regCode } : { regCode: parentData?.regCode }),
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
    // const userId = searchParams.get("userId");
    const brgyCode = searchParams.get("brgyCode");
    const code = searchParams.get("code");
    const level = searchParams.get("level");

    // const citymunCode = searchParams.get("citymunCode");



    // let citis = citymunCode ? citymunCode.split(',').map(city => {
    //   return { citymunCode: { $regex: city, $options: "i" } }
    // }) : []


    const skip = (page) * limit;
    console.log(page, limit, 'pagination')
    // Fetch user to determine access level
    let parent = await User.findById(system);
    // let contact = await User.findById(userId);

    let contacts = [];

    if (!parent) {
      return NextResponse.json({ error: "System not found" }, { status: 404 });
    }


    let brgys = brgyCode ? brgyCode.split(',').map(brgy => {
      return { brgyCode: { $regex: brgy, $options: "i" }, parNum: parent._id }
    }) : (code && level) ? [{ [level]: code, parNum: parent._id }] : []

    // Apply user-level filtering
    let query: any = { deletedAt: null };

    if (parent.userType === "admin") {
      // Admin sees all contacts
    } else if (parent.userType === "system") {
      query.parNum = parent._id;
    } else if (brgys.length) {
      query.$or = brgys;
    }

    if (search) {
      query.$and = [{
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { precinct: { $regex: search, $options: "i" } },
          { marker: { $regex: search, $options: "i" } },
        ]
      }, { $or: brgys }, { parNum: parent?._id }];
    }

    /*    if (system) {
         query.parNum = parent?._id;
       } */

    // Fetch contacts with pagination
    contacts = await Contact.find(query)
      // .skip(skip)
      // .limit(limit)
      .sort({ createdAt: -1 })
      .lean();


    // Process and enrich contacts with region, province, city, and barangay names
    const newContacts = contacts.map((contact: any) => {
      let barangay = barangays.find((brgy: any) => brgy.brgyCode == contact.brgyCode)?.brgyDesc;
      let citymun = municipalities.find((citymun: any) => citymun.citymunCode == contact.citymunCode)?.citymunDesc;
      let province = provinces.find((province: any) => province.provCode == contact.provCode)?.provDesc;
      let region = regions.find((region: any) => region.regCode == contact.regCode)?.regDesc;
      let keyStr = objectToString({ name: contact.name, address: contact.address, marker: contact.marker, precinct: contact.precinct, barangay, citymun, province, region })
      return { _id: contact._id, name: contact.name, address: contact.address, marker: contact.marker, precinct: contact.precinct, barangay, citymun, province, region, keyStr }
    })

    // Get total contact count for pagination
    const totalContacts = await Contact.countDocuments(query);

    return NextResponse.json(
      {
        data: newContacts,
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




