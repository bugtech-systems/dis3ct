import { NextRequest, NextResponse } from "next/server";
import { barangays } from "@/lib/locationData";

export const GET = async (req: NextRequest) => {

  const { searchParams } = new URL(req.url);
  const accessCode = searchParams.get("code") || "";
  const accessLevel = searchParams.get("level") || "";

  const filteredBarangays = barangays
    .map((brgy: any) => ({ brgyCode: brgy.brgyCode, brgyDesc: brgy.brgyDesc, citymunCode: brgy.citymunCode, provCode: brgy.provCode, regCode: brgy.regCode }))
    .filter((barangay: any) => barangay[accessLevel] == accessCode)
    .sort((a, b) => a.brgyDesc.localeCompare(b.brgyDesc)); // Sort by brgyDesc

  if (filteredBarangays.length === 0) {
    return NextResponse.json({ success: false, message: "No barangays found for the given municipality code." }, { status: 404 });
  }

  return NextResponse.json(filteredBarangays[0]);
};
