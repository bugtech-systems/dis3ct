import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import Contact from "@/models/Contact";
import { sanitizePhoneNumber } from "@/lib/helpers";
import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import User from "@/models/User";

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


    let newTags = updatedContact?.tags as any[];



    let tagExist = updatedContact?.tags?.find(tag => String(tag?.user) == String(authUser?._id))


    if (tagExist) {
      // if(tagExist)
      newTags = newTags.filter(tag => String(tag.user) != String(authUser._id));

      if (tagExist.tagType != type) {
        newTags.push({
          tagType: type,
          user: authUser?._id
        })
      }




    } else {
      newTags = newTags ? newTags : []
      newTags.push({
        tagType: type,
        user: authUser?._id
      })
    }


    updatedContact.tags = newTags;

    await updatedContact?.save()

    return NextResponse.json(updatedContact, { status: 200 });
  } catch (err) {
    console.log("[courseId_publish_POST]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
};
