import { createPreset, getAllPresets } from "@/services/presetServices";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const result = await createPreset(body);

console.log(result, 'RESULT PRESRT')

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

export const GET = async (): Promise<NextResponse> => {
  try {
    const result = await getAllPresets();

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
