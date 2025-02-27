import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import connectToDatabase from "@/lib/mongodb";
import Contact from "@/models/Contact";
import User from "@/models/User";



export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { rows: contacts, regCode, provCode, citymunCode, brgyCode, refNum, parNum } = await req.json();

    const session = await getServerSession(authOptions) as any;
    // console.log(session, 'SESS')
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }




    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ message: "No contacts provided" }, { status: 400 });
    }


    const phone = session.user.phone;
    const userId = session.user.id;

    console.log(userId, phone, 'AUTH CONTACT')
    const contact = await User.findById(userId);
    // let parNum = contact?.parent ?? contact?._id;



    // Extract unique identifiers
    const existingContacts = await Contact.find({
      $or: contacts.map(({ idNum, name }) => ({ idNum, name, refNum, parNum })),
    }).select("idNum name");

    const existingSet = new Set(existingContacts.map((c) => `${c.idNum}-${c.name}`));

    // Separate new contacts from duplicates
    const newContacts = contacts.filter(
      (contact) => !existingSet.has(`${contact.idNum}-${contact.name}`)
    );



    console.log(regCode, provCode, citymunCode, brgyCode, parNum, refNum, "DTA")
    let allContacts = newContacts.map((contact) => {
      return { ...contact, regCode, provCode, citymunCode, brgyCode, parNum, refNum, uplines: [parNum, refNum] }
    });

    if (allContacts.length > 0) {
      await Contact.insertMany(allContacts);
    }

    return NextResponse.json({
      message: "Bulk insert completed",
      inserted: allContacts.length,
      skipped: contacts.length - allContacts.length,
      skippedContacts: existingContacts, // Return details of skipped contacts
    });
  } catch (error) {
    console.error("Bulk insert error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
