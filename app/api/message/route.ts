import { sanitizePhoneNumber } from "@/lib/helpers";
import Contact from '@/models/Contact';
import Mobile from "@/models/Mobile";
import { withAuth } from '@/lib/withAuth';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";

export const POST = async (req: NextRequest) => {
  try {
    await dbConnect();
    const body = await req.json();

    const { senderId, recipientId, message, tag, status, isFlash, messageType } = body;

    const newMessage = new Message({
      senderId,
      recipientId,
      message,
      tag,
      status,
      isFlash,
      messageType,
    });

    const savedMessage = await newMessage.save();

    return NextResponse.json({ success: true, data: savedMessage }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create message" }, { status: 500 });
  }
};


export const GET = async (req: NextRequest) => {
    try {
      await dbConnect();
  
      const url = new URL(req.url);
      const senderId = url.searchParams.get("senderId");
      const recipientId = url.searchParams.get("recipientId");
  
      const query: any = {};
      if (senderId) query.senderId = senderId;
      if (recipientId) query.recipientId = recipientId;
  
      const messages = await Message.find(query).sort({ createdAt: -1 });
  
      return NextResponse.json({ success: true, data: messages }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
    }
  };
  

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      await dbConnect();
      const { id } = params;
      const updateData = await req.json();
  
      const updatedMessage = await Message.findByIdAndUpdate(id, updateData, { new: true });
  
      if (!updatedMessage) {
        return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
      }
  
      return NextResponse.json({ success: true, data: updatedMessage }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ success: false, error: "Failed to update message" }, { status: 500 });
    }
  };
  