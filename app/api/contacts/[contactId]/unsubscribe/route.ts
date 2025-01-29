import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";
import { sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";

const isAuthorized = async (userId: string, contactId: string) => {
  await dbConnect();
  const contact = await Contact.findOne({ phone: sanitizePhoneNumber(contactId) });

  if (!contact) return false;

  // Check if user is the referrer (refNum) OR has admin access
  return contact.refNum?.toString() === userId || contact.userLevel === "admin";
};


export const POST = async (
  req: NextRequest,
  { params }: { params: { contactId: string } }
) => {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;
    const { contactId } = params;

    let contact = await Contact.findById(userId);





    const updatedContact = await Contact.updateOne(
      { phone: sanitizePhoneNumber(contactId), deletedAt: null, parNum: contact?.id },
      { $set: { subscribed: false } }
    );


    return NextResponse.json(updatedContact, { status: 200 });
  } catch (err) {
    console.log("[courseId_publish_POST]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
