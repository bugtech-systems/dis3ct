import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";


export const POST = async (req: NextRequest) => {
  try {

    const data = await req.json();

    if (!data?.phone) return new NextResponse("Not Found", { status: 404 })

    let { phone, recordId, isFlash } = data;

    let newPhone = sanitizePhoneNumber(phone);

    if (!recordId) {
      return NextResponse.json({ message: 'Record not found!' }, { status: 404 });
    }

    await connectToDatabase();

    let record = await Contact.findById(recordId) as any;

    if (record) {
      record.phone = newPhone;
      await record.save()

    }




    console.log(record, 'RECORD')
    return NextResponse.json({ message: 'Invite Sent!' }, { status: 201 });

  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}




