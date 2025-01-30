import { NextRequest, NextResponse } from "next/server";
import { municipalities } from "@/lib/locationData";

export const GET = async (_req: NextRequest) => {
  const filteredMunicipalities = municipalities
    // .filter((municipality: any) => municipality.provCode === provCode)
    .map((mun: any) => ({ citymunCode: mun.citymunCode, citymunDesc: mun.citymunDesc, provCode: mun.provCode }));

  if (filteredMunicipalities.length === 0) {
    return NextResponse.json({ success: false, message: "No municipalities found for the given province code." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: filteredMunicipalities });
};
