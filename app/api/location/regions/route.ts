import { NextRequest, NextResponse } from "next/server";
import { regions } from "@/lib/locationData";

export const GET = async (req: NextRequest) => {
  return NextResponse.json({ success: true, data: regions });
};
