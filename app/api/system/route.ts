import { createSystem, getAllSystems } from "@/services/systemServices";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const result = await createSystem(body);
  console.log(result, 'RESULTT')
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 201 });
};

export const GET = async () => {
  const result = await getAllSystems();
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 200 });
};
