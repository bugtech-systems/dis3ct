import { NextRequest, NextResponse } from "next/server";
import { municipalities, provinces, regions } from "@/lib/locationData";

export const GET = async (_req: NextRequest) => {
  const filteredMunicipalities = municipalities
    // .filter((municipality: any) => municipality.provCode === provCode)
    .map((mun: any) => {
      let province = provinces.find(prov => prov.provCode == mun.provCode);
      let region = regions.find(reg => reg.regCode == mun.regDesc);

      return { citymunCode: mun.citymunCode, citymunDesc: mun.citymunDesc, provCode: mun.provCode, regCode: mun.regDesc, regDesc: region.regDesc, provDesc: province.provDesc }

    })
    .sort((a, b) => a.citymunDesc.localeCompare(b.citymunDesc)); // Sort by brgyDesc




  console.log(regions, 'MUNS', filteredMunicipalities)
  if (filteredMunicipalities.length === 0) {
    return NextResponse.json({ success: false, message: "No municipalities found for the given province code." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: filteredMunicipalities });
};
