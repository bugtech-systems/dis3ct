import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";
import { sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";

// ✅ Secure Helper Function to Check Authorization
const isAuthorized = async (userId: string, contactId: string) => {
  await dbConnect();
  const contact = await Contact.findOne({ phone: sanitizePhoneNumber(contactId) });

  if (!contact) return false;

  // Check if user is the referrer (refNum) OR has admin access
  return contact.refNum?.toString() === userId || contact.userLevel === "admin";
};

// ✅ PATCH: Update Contact (Secured)
export const PATCH = async (
  req: NextRequest,
  { params }: { params: { contactId: string } }
) => {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // const userId = session.user.id;
    const { contactId } = params;
    const values = await req.json();

    // if (!(await isAuthorized(userId, contactId))) {
    //   return new NextResponse("Forbidden", { status: 403 });
    // }

    const updatedContact = await Contact.updateOne(
      { phone: sanitizePhoneNumber(contactId), deletedAt: null },
      { $set: values }
    );

    if (!updatedContact.modifiedCount) {
      return new NextResponse("Contact not found or unchanged", { status: 404 });
    }

    return NextResponse.json(updatedContact, { status: 200 });
  } catch (err) {
    console.error("Error updating contact:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ GET: Fetch Contact (Public Access)
export const GET = async (
  req: NextRequest,
  { params }: { params: { contactId: string } }
) => {
  try {
    await dbConnect();
    const { contactId } = params;

    const contact = await Contact.findById(contactId).populate('parNum');

    if (!contact) {
      return new NextResponse("Contact not found", { status: 404 });
    }

    return NextResponse.json(contact, { status: 200 });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
};

// ✅ DELETE: Soft Delete Contact (Secured)
export const DELETE = async (
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

    if (!(await isAuthorized(userId, contactId))) {
      return new NextResponse("Forbidden", { status: 403 });
    }


    const contact = await Contact.findOne({ phone: sanitizePhoneNumber(contactId) });

    if (!contact) {
      return new NextResponse("Contact not found", { status: 404 });
    }

    await Contact.findOneAndUpdate(
      { phone: sanitizePhoneNumber(contactId) },
      { $set: { deletedAt: new Date() } }
    );

    return new NextResponse("Contact deleted", { status: 200 });
  } catch (err) {
    console.error("Error deleting contact:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
