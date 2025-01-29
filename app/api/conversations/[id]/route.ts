import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import AiPreset from "@/models/AiPreset";
import { getConversationById, updateConversation } from "@/services/conversationServices";
import Conversation from "@/models/Conversation";




export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> => {
  try {
    const { id } = params;
    const result = await getConversationById(id);

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
    const result = await updateConversation(id, body);

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


export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const { id } = params;


    await Conversation.findByIdAndDelete(id);

    return new NextResponse("Contact deleted", { status: 200 });
  } catch (err) {
    console.error("Error deleting contact:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};