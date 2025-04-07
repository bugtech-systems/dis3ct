import { sanitizeObject, sanitizePhoneNumber } from "@/lib/helpers";
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
    const brgyCode = searchParams.get("brgyCode");
    const tags = searchParams.get("tags");
    const precincts = searchParams.get("precincts");

    const phoneFilter = searchParams.get("phone");
    const userId = searchParams.get("userId");

    const skip = (page - 1) * limit; // Correct pagination logic

    // Fetch user to determine access level
    let user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let parent = await User.findById(user.userType === "system" ? user._id : user.parent);
    if (!parent) {
      parent = user;
    }

    // Base query
    let query: any = { deletedAt: null, parNum: parent._id };

    // Filter by barangay code if provided
    if (brgyCode) {
      query.brgyCode = { $in: brgyCode.split(",") };
    }

    if (precincts) {
      query.precinct = { $in: precincts.split(",") };
    }


    if (tags) {
      const tagList = tags.split(",");

      if (tagList.includes("unknown")) {
        // If "Unknown" is requested, return records without a `tags` field or an empty `tags` array
        query.$or = [
          { tags: { $exists: false } },
          { tags: { $size: 0 } }
        ];
      } else {
        // Otherwise, filter by specific tagTypes
        query.tags = { $elemMatch: (user.userType == 'system' || user.userType == 'admin') ? { value: { $in: tagList } } : { value: { $in: tagList }, user: user._id, tagType: 'tag' } };
      }

    }

    // Include only contacts with a phone number if requested
    if (phoneFilter) {
      // query['tags.tagType'] = 'phone';
      // query['tags.user'] = String(user._id);
      query['phone'] = { $exists: true };

    }

    console.log(query, 'QUE')
    // Search functionality
    if (search) {
      const searchLower = search.trim().toLowerCase();
      query.$or = [
        { name: { $regex: searchLower, $options: "i" } },
        { phone: { $regex: searchLower, $options: "i" } },
        { address: { $regex: searchLower, $options: "i" } },
        { username: { $regex: searchLower, $options: "i" } },
        { precinct: { $regex: searchLower, $options: "i" } },
        { marker: { $regex: searchLower, $options: "i" } },
      ];
    }

    // Fetch contacts with pagination
    const contacts = await Contact.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 })
      .lean();



    // Process and enrich contacts
    const newContacts = contacts.map((contact: any) => {
      const barangay = barangays.find((b) => b.brgyCode === contact.brgyCode)?.brgyDesc;
      const citymun = municipalities.find((c) => c.citymunCode === contact.citymunCode)?.citymunDesc;
      const province = provinces.find((p) => p.provCode === contact.provCode)?.provDesc;
      const region = regions.find((r) => r.regCode === contact.regCode)?.regDesc;
      let tags = contact?.tags ? (user.userType == 'system' || user.userType == 'admin') ? contact.tags.sort((a, b) => b.timestamp - a.timestamp) : contact.tags.filter(a => String(a.user) == String(user._id)).sort((a, b) => b.timestamp - a.timestamp) : []

      let tagContact = tags.filter(a => (a.tagType == 'tag' && String(a.user) == String(user._id))).sort((a, b) => b.timestamp - a.timestamp)
      const tagPhone = tags.find(a => { return (a.tagType == 'phone' && String(a.user) == String(user._id)) })?.value
      return {
        _id: contact._id,
        name: contact.name,
        phone: tagPhone || contact.phone,
        address: contact.address,
        marker: contact.marker,
        precinct: contact.precinct,
        brgyCode: contact.brgyCode,
        citymunCode: contact.citymunCode,
        barangay,
        citymun,
        province,
        region,
        biometric: contact.biometric,
        recordType: contact.recordType,
        school: contact.school,
        tags: tags,
        tag: tagContact.length ? tagContact[0].value : 'unknown',
        subscribed: contact.subscribed,
        descriptor: contact.descriptor
      };
    });


    // Get total contact count for pagination
    const totalContacts = await Contact.countDocuments(query);

    return NextResponse.json(
      {
        data: sanitizeObject(newContacts),
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
