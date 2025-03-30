import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";
import { sanitizeObject, sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";
import { logAction } from "@/services/auditLogsService";

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

    await dbConnect()

    // const userId = session.user.id;
    const { contactId } = params;
    const { type, system } = await req.json();

    let authUser = await User.findById(system);

    if (!authUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }


    const updatedContact = await Contact.findById(contactId);

    if (!updatedContact) {
      return NextResponse.json({ message: 'Record not found' }, { status: 401 });
    }

    let action = 'Tag Record';
    let isTag = false;
    let newTags = updatedContact?.tags as any[];



    let tagExist = updatedContact?.tags?.find(tag => String(tag?.user) == String(authUser?._id))
    newTags = newTags.filter(tag => String(tag.user) != String(authUser._id));




    if (tagExist) {
      // if(tagExist)

      if (tagExist.value != type) {

        newTags.push({
          tagType: 'tag',
          user: authUser?._id,
          value: type
        })
        isTag = true;
      }




    } else {
      newTags = newTags ? newTags : []
      newTags.push({
        tagType: 'tag',
        value: type,
        user: authUser?._id
      })
      isTag = true;
    }


    updatedContact.tags = newTags;

    await updatedContact?.save()



    logAction(userId, action, `${isTag ? 'Tagged' : 'Untagged'} ${updatedContact.name} record as ${type}.`)


    return NextResponse.json({ ...sanitizeObject(updatedContact), tag: type }, { status: 200 });
  } catch (err) {
    console.log("[courseId_publish_POST]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};


export async function DELETE(req: NextRequest, { params }: { params: { contactId: string } }) {
  try {
    const { tagType, value } = await req.json();

    if (!tagType) {
      return NextResponse.json({ error: "Missing tag type" }, { status: 400 });
    }

    const { contactId } = params;
    await dbConnect();

    const contact = await Contact.findOne({ _id: contactId }) as any;
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const updatedTags = contact?.tags.filter((tag: any) => !(tag.tagType == tagType && tag.value == value));
    await Contact.updateOne(
      { _id: contactId },
      { $set: { tags: updatedTags, descriptor: null } }
    );

    return NextResponse.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.log(error, 'ERROR')
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}