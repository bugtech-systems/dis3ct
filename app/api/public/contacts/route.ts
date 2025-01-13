import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";


export const POST = async (req: NextRequest) => {
  try {


    const data = await req.json()

    if(!data?.phone) return new NextResponse("Not Found", { status: 404 })

    let newPhone = sanitizePhoneNumber(data?.phone);

    
      await connectToDatabase();
      
      
          
    const contact = await Contact.findOne({ phone: newPhone});

    if (contact) {
      return new NextResponse('Invitation Sent!', { status: 200 });
    }
      
      
    const newMobile = new Mobile({phone: newPhone});
  
      
    const newContact = new Contact({ ...data, mobile: newMobile, phone: newPhone});
    await newMobile.save();
    await newContact.save();
      return NextResponse.json('Invitation Sent!', { status: 201 });
    
    } catch (error) {
      console.error('Error creating contact:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }    
    
}  




