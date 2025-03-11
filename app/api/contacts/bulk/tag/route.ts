import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";
import { sanitizeObject } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";
import { logAction } from "@/services/auditLogsService";

export const POST = async (req: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    await dbConnect();

    const { type, system, contactIds } = await req.json();

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ message: "Invalid contactIds array" }, { status: 400 });
    }

    const authUser = await User.findById(system);
    if (!authUser) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    // Fetch all contacts in a single query
    const contacts = await Contact.find({ _id: { $in: contactIds } });

    if (!contacts.length) {
      return NextResponse.json({ message: "No records found" }, { status: 404 });
    }

    let updatedContacts = [];

    for (const contact of contacts) {
      let action = "Tag Record";
      let isTag = false;
      let newTags = contact.tags || [];

      // Remove existing tag by this user
      newTags = newTags.filter(tag => String(tag.user) !== String(authUser._id));

      // Add new tag if it's different from the previous one
      newTags.push({ tagType: type, user: authUser._id });
      isTag = true;

      contact.tags = newTags;
      await contact.save();
      updatedContacts.push(sanitizeObject(contact));

      // Log the action
      logAction(userId, action, `${isTag ? "Tagged" : "Untagged"} ${contact.name} as ${type}.`);
    }

    return NextResponse.json({ updatedContacts, tag: type }, { status: 200 });

  } catch (err) {
    console.error("[POST] Error updating multiple contacts:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
