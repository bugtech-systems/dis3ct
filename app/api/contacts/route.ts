import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";
import { withAuth } from '@/lib/withAuth';


export const POST = async (req: NextRequest) => {
  try {


    const data = await req.json()

    if(!data?.phone) return new NextResponse("Not Found", { status: 404 })

    let newPhone = sanitizePhoneNumber(data?.phone);

    
      await connectToDatabase();
      
      
          
    const contact = await Contact.findOne({ phone: newPhone});

    if (contact) {
      return NextResponse.json(contact, { status: 200 });
    }
      
      
    const newMobile = new Mobile({phone: newPhone});
  
      
    const newContact = new Contact({ ...data, mobile: newMobile, phone: newPhone});
   await newMobile.save()
    const savedContact = await newContact.save();
      return NextResponse.json(savedContact, { status: 201 });
    
    } catch (error) {
      console.error('Error creating contact:', error);
      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }    
    
}  



export const GET = withAuth(async (req: NextRequest) => {
  try {
  
    const userHeader = req.headers.get('X-User');
    const user = userHeader ? JSON.parse(userHeader) : null;

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
  
    await connectToDatabase();
    

  
    
    
    
    if(!user){
      return new NextResponse('Unauthorized!', { status: 401 });
    }



    const contacts = await Contact.find().sort({ createdAt: -1 });

    return NextResponse.json({contacts, user} , { status: 200 });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
})


