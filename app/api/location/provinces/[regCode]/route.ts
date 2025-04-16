import { NextRequest, NextResponse } from "next/server";
import { provinces } from "@/lib/locationData";

export const GET = async (_req: NextRequest, { params }: { params: { regCode: string } }) => {
  const { regCode } = params;
  const filteredProvinces = provinces.filter((province: any) => province.regCode === regCode);

  if (filteredProvinces.length === 0) {
    return NextResponse.json({ success: false, message: "No provinces found for the given region code." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: filteredProvinces });
};
