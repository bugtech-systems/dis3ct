// app/api/generate-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import Task from '@/models/Task';
import { v4 as uuidv4 } from "uuid";
import { internationalizePhoneNumber, sanitizePhoneNumber } from '@/lib/helpers';
import { sendOTP } from '@/lib/otp';
import { generateOTP } from '@/lib/otp';
// import Mobile from '@/models/Mobile';
import bcrypt from 'bcryptjs';
import axios from 'axios';

export const POST = async (req: NextRequest) => {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return new NextResponse('Mobile number is required' , { status: 400 });
    }

    await connectToDatabase();
     let contact;
     
     contact = await Contact.findOne({
     phone: sanitizePhoneNumber(phone)
     });
     
     if(!contact){
        return new NextResponse('Mobile number not user', { status: 400 });
     }
     
     if(contact.userLevel == 'normal'){
      return new NextResponse('Mobile number not authorized', { status: 400 });
   }
     
        





    // Generate a 6-digit OTP
    const otp = await generateOTP();
    contact.otpCode = await bcrypt.hash(otp, 10);
    contact.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    await contact.save();
    // await sendOTP(phone, otp);
    // const payload = {
    //   recipients: [internationalizePhoneNumber(phone)], // Extract phone numbers
    //   message: `One Time Password: ${otp}\n Maretext App.`,
    //   isFlash: false,
    // };
  
    // const resp = await axios.post("/api/tasks/sms", payload);
    // console.log(resp, 'OTP RESP')
    // Set OTP expiration time (e.g., 10 minutes)
    // const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in the database
    // await Contact.updateOne() ({ mobile, otp, expiresAt });

  
      // Insert tasks into MongoDB
      await Task.create({
        taskId: `TASK-${uuidv4().slice(0, 8).toUpperCase()}`,
        title: "Send SMS OTP",
        category: "Sms",
        status: "Todo",
        priority: "High",
        taskObject: JSON.stringify({
          phone: internationalizePhoneNumber(phone),
          message: `One Time Password: ${otp}\n Maretext App.`,
          isFlash: false,
        }),
      });
  
    //   return res.status(200).json(updatedContact);
    // Send OTP to the user's mobile number
    // await sendOtpToMobile(mobile, otp);

    return NextResponse.json({ message: 'OTP sent successfully', otp }, { status: 200 });
  } catch (error) {
    console.error('Error generating OTP:', error);
    return new NextResponse('Internal Server Error' , { status: 500 });
  }
};
