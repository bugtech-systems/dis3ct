import { getPresetById, updatePreset } from "@/services/presetServices";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    const { id } = params;
    const result = await getPresetById(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch preset" },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    const { id } = params;
    const body = await req.json();
    const result = await updatePreset(id, body);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update preset" },
      { status: 500 }
    );
  }
};
