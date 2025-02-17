import { NextRequest, NextResponse } from "next/server";
import { barangays } from "@/lib/locationData";

export const GET = async (_req: NextRequest, { params }: { params: { citymunCode: string; } }) => {
  const { citymunCode } = params;
  const filteredBarangays = barangays
    .filter((barangay: any) => barangay.citymunCode === citymunCode)
    .map((brgy: any) => ({ brgyCode: brgy.brgyCode, brgyDesc: brgy.brgyDesc, citymunCode: brgy.citymunCode, provCode: brgy.provCode, regCode: brgy.regCode }));

  if (filteredBarangays.length === 0) {
    return NextResponse.json({ success: false, message: "No barangays found for the given municipality code." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: filteredBarangays });
};
