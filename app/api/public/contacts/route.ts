import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";


export const POST = async (req: NextRequest) => {
  try {

    const data = await req.json();

    if (!data?.phone) return new NextResponse("Not Found", { status: 404 })

    let { phone, system, referrer, userLevel, username, otpCode, name } = data;

    let newPhone = sanitizePhoneNumber(data?.phone);


    await connectToDatabase();




    const parentData = await Contact.findOne({ phone: sanitizePhoneNumber(system ?? referrer), userLevel: 'system', deletedAt: null });

    // if (!parentData) {
    //   return NextResponse.json({ error: "System contact not found." }, { status: 400 });
    // }


    let refData = await Contact.findOne({ phone: sanitizePhoneNumber(referrer ?? system), parNum: parentData?._id, deletedAt: null });




    if (!refData) {
      refData = parentData
      // return NextResponse.json({ error: "Referrer contact not found." }, { status: 400 });
    }


    let contact = await Contact.findOne({ phone: sanitizePhoneNumber(phone), parNum: parentData?._id, deletedAt: null }) as any;

    if (!contact) {
      contact = new Contact({
        phone: sanitizePhoneNumber(phone),
        refNum: refData?._id,
        parNum: parentData?._id,
        userLevel, username, otpCode, name
      }) as any;

      if (userLevel == 'admin') {
        contact.refNum = contact?._id;
        contact.parNum = contact?._id;
      }

    }

    console.log(contact, 'CONTACT')


    let refExist = contact?.uplines?.find(contact => contact == refData.id)

    if (!refExist && refData) {
      contact?.uplines?.push(refData.id)
    }




    const savedContact = await contact.save();



    return NextResponse.json(savedContact, { status: 201 });

  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}




