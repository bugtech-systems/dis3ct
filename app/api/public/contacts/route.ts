import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";


export const POST = async (req: NextRequest) => {
  try {

    const data = await req.json();

    if (!data?.phone) return new NextResponse("Not Found", { status: 404 })

    let { phone, system, referrer } = data;

    let newPhone = sanitizePhoneNumber(data?.phone);


    await connectToDatabase();




    const parentData = await Contact.findOne({ phone: sanitizePhoneNumber(system || referrer) });

    if (!parentData) {
      return NextResponse.json({ error: "System contact not found." }, { status: 400 });
    }


    let refData = await Contact.findOne({ phone: sanitizePhoneNumber(referrer || system), parNum: parentData?._id });




    if (!refData) {
      refData = parentData
      // return NextResponse.json({ error: "Referrer contact not found." }, { status: 400 });
    }


    let contact = await Contact.findOne({ phone: sanitizePhoneNumber(phone), parNum: parentData?._id })

    if (!contact) {
      contact = new Contact({
        phone: sanitizePhoneNumber(phone),
        refNum: refData?.id,
        parNum: parentData?.id
      })
    }


    let refExist = contact?.uplines?.find(contact => contact == refData.id)

    if (!refExist && refData) {
      contact?.uplines?.push(refData.id)
    } else {
      return NextResponse.json({ error: "Contact already exist." }, { status: 400 });
    }

    const newMobile = new Mobile({ phone: newPhone });


    const savedContact = await contact.save();



    return NextResponse.json(savedContact, { status: 201 });

  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}




