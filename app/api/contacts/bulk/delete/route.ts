import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";
// import { withAuth } from '@/lib/withAuth';


export const POST = async (req: NextRequest) => {

  try {
    const session = await getServerSession(authOptions) as any;
    const { searchParams } = new URL(req.url) as any;

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    const data = await req.json()

    const phone = session.user.phone;
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

    if (contact?.userLevel != 'system') {
      options.uplines = { $in: [String(contact?._id)] }// Check if referrer.id is in the uplines array
    }


    const updatedContact = await Contact.deleteMany(options);


    // return NextResponse.json(updatedContact, { status: 201 });
    return NextResponse.json('Deleted Successfully', { status: 201 });

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
    let fieldParam = searchParams.get("field");

    // Check if user is authenticated
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    // }



    await connectToDatabase()







    await Contact.deleteMany({ [fieldParam]: { $exists: true } });

    // if(!user){
    //   return new NextResponse('Unauthorized!', { status: 401 });
    // }



    return NextResponse.json({ message: 'Deleted Success' }, { status: 200 });
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
