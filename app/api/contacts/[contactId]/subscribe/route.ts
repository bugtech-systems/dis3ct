import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";
import { checkContactId, sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";
import { logAction } from "@/services/auditLogsService";

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

    await dbConnect()

    const userId = session.user.id;
    const { contactId } = params;

    let contact = await User.findById(userId);




    const updatedContact = await Contact.updateOne(
      { $or: [{ phone: sanitizePhoneNumber(contactId), parNum: contact?.parent }, { _id: checkContactId(contactId) }], deletedAt: null },
      { $set: { subscribed: true } }
    );



    if (!updatedContact.modifiedCount) {
      return new NextResponse("Contact not found or unchanged", { status: 404 });
    }

    logAction(userId, 'Subscribed', `New Subscription.  ${contactId}. triggered by ${contact.name}.`)

    return NextResponse.json(updatedContact, { status: 200 });
  } catch (err) {
    console.log("[courseId_publish_POST]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
