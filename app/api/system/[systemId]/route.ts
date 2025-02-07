import { NextRequest, NextResponse } from "next/server";
import System from "@/models/System";
import dbConnect from "@/lib/mongodb";
import { sanitizePhoneNumber } from "@/lib/helpers";


export const GET = async (
  req: NextRequest,
  { params }: { params: { systemId: string } }
) => {
  try {
    await dbConnect();
    const { systemId } = params;

    const system = await System.findOne({ number: sanitizePhoneNumber(systemId) });
    if (!system) {
      return new NextResponse("System not found", { status: 404 });
    }

    return NextResponse.json(system, { status: 200 });
  } catch (error) {
    console.log("Error fetching system:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch system" },
      { status: 500 }
    );
  }
};


export const PATCH = async (
  req: NextRequest,
  { params }: { params: { systemId: string } }
) => {
  try {


    // const userId = session.user.id;
    const { systemId } = params;
    const values = await req.json();

    // if (!(await isAuthorized(userId, contactId))) {
    //   return new NextResponse("Forbidden", { status: 403 });
    // }

    const updatedContact = await System.findByIdAndUpdate(systemId,
      { $set: values }
    );

    /*    if (!updatedContact.modifiedCount) {
         return new NextResponse("Contact not found or unchanged", { status: 404 });
       } */

    return NextResponse.json(updatedContact, { status: 200 });
  } catch (err) {
    console.error("Error updating contact:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};