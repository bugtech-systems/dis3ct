import { NextRequest, NextResponse } from "next/server";


import { createConversation, getAllConversations } from "@/services/conversationServices";
import { getContactById, getContactByNumber } from "@/services/contactServices";
import { getPresetByValue } from "@/services/presetServices";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    let systemParam = searchParams.get("system");
    let contactParam = searchParams.get("contact");
    let presetParam = searchParams.get("preset");

    let options = {} as any;
    // Validate required parameters
    if (!systemParam || !contactParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters 'system' or 'contact'.",
        },
        { status: 400 }
      );
    }




    let systemContact = await getContactByNumber(systemParam);
    let senderContact = await getContactByNumber(contactParam, systemContact.data?.phone);
    let systemPreset = await getPresetByValue(presetParam);


    if (senderContact.data) {
      options.contact = senderContact.data._id;
    }

    if (systemContact.data) {
      options.system = systemContact.data._id;
    }

    if (systemPreset.data) {
      options.preset = systemPreset.data._id;
    }


    // Fetch conversations filtered by system and contact
    const result = await getAllConversations(options);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "No conversations found." },
        { status: 404 }
      );
    }


    return NextResponse.json(result.data, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
};

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const result = await createConversation(body);
  console.log(result, 'RESULTT')
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 201 });
};
