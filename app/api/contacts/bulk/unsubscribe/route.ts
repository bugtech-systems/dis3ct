import { ObjectId } from "mongodb";
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
    const session = await getServerSession(authOptions) as any;
    const { searchParams } = new URL(req.url) as any;

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    const data = await req.json()

    const userId = session.user.id;

    await connectToDatabase()

    let contact = await Contact.findById(userId);
    let { rows } = data;


    console.log(rows, 'DELETING')
    let objectIds = [];

    objectIds = rows.map((row: any) => row.id);

    let options = {
      _id: { $in: objectIds }
    } as any;

    // if (contact?.userLevel != 'system') {
    //   options.uplines = { $in: [String(contact?._id)] }// Check if referrer.id is in the uplines array
    // }


    await Contact.updateMany(options, { $set: { subscribed: false } });

    // return NextResponse.json(updatedContact, { status: 201 });
    return NextResponse.json('Unsubscribed Successfully', { status: 201 });

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



export const PATCH = async (
  req: NextRequest
) => {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }


    // if (!(await isAuthorized(userId, contactId))) {
    //   return new NextResponse("Forbidden", { status: 403 });
    // }


    // if (!(await isAuthorized(userId, contactId))) {
    //   return new NextResponse("Forbidden", { status: 403 });
    // }
    const data = await req.json()


    console.log(data, "DELETE")

    // const updatedContact = await Contact.findByIdAndUpdate(id,
    //   { $set: { deletedAt: new Date } }
    // );




    return new NextResponse("Contact deleted", { status: 200 });
  } catch (err) {
    console.error("Error deleting contact:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
