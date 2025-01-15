import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";


export const POST = async (req: NextRequest) => {
  try {


    const data = await req.json();

    if(!data?.phone) return new NextResponse("Not Found", { status: 404 })

    let newPhone = sanitizePhoneNumber(data?.phone);

    
      await connectToDatabase();
      
    let options = { phone: newPhone} as any;
    
      
    const referrer = await Contact.findOne({ phone: sanitizePhoneNumber(data?.referrer) });

    if(referrer){
      options.refNum = referrer.id;
      options.parNum = referrer.parNum || referrer.id;
    }
      
      
      
      
          
    const contact = await Contact.findOne(options);

    if (contact) {
      return new NextResponse('Invitation Sent!', { status: 200 });
    }
      
      
    await Mobile.create({phone: sanitizePhoneNumber(data.phone)}).catch(err => {
      console.log('Mobile Error')
    });  
      
    const newContact = new Contact({ ...data, phone: newPhone});
    // await newMobile.save();
    await newContact.save();
      return NextResponse.json('Invitation Sent!', { status: 201 });
    
    } catch (error) {
      console.error('Error creating contact:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }    
    
}  




