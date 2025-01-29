import { sanitizePhoneNumber } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
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

    let { phone, system, referrer } = data;

    let newPhone = sanitizePhoneNumber(data?.phone);


    await connectToDatabase();




    const parentData = await Contact.findOne({ phone: sanitizePhoneNumber(system) });

    if (!parentData) {
      return NextResponse.json({ error: "System contact not found." }, { status: 400 });
    }



    let refData = await Contact.findOne({ phone: sanitizePhoneNumber(referrer), parNum: parentData?._id });


    if (!refData) {
      refData = parentData;
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



export const GET = async (req: NextRequest) => {
  try {
    await connectToDatabase();


    const session = await getServerSession(authOptions) as any;
    const { searchParams } = new URL(req.url) as any;

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const phone = session.user.phone;
    const userId = session.user.id;

    await connectToDatabase()

    let contact = await Contact.findById(userId);


    if (!contact) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }


    const contacts = await Contact.find({ parNum: contact.parNum }).sort({ createdAt: -1 }).populate('parNum');










    // if(!user){
    //   return new NextResponse('Unauthorized!', { status: 401 });
    // }



    // console.log(contacts, 'CONTACTSssss')
    return NextResponse.json(contacts, { status: 200 });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


