import { sanitizePhoneNumber } from "@/lib/helpers";
import { getContactByNumber } from "@/services/contactServices";
import { createPreset, getAllPresets } from "@/services/presetServices";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const result = await createPreset(body);


    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url) as any;
    let systemParam = searchParams.get("system");
    let options = { contact: null } as any;

    // if (systemParam) {
    //   let senderContact = await getContactByNumber(sanitizePhoneNumber(systemParam));
    //   if (senderContact.data) {
    //     options.contact = senderContact.data.id;
    //   }
    // }






    const result = await getAllPresets(options);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }



    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch presets" },
      { status: 500 }
    );
  }
};
