// utils/otp.ts
import { internationalizePhoneNumber, sanitizePhoneNumber } from '@/lib/helpers';
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import axios from 'axios';
// import crypto from 'crypto';
import bcrypt from 'bcryptjs';


export function generateOTP(length: number = 6): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}




export async function sendOTP(phone: string, otp: string): Promise<void> {



  // Integrate with your SMS service provider here
  // Example:
  // await smsService.send({
  //   to: phone,
  //   message: `Your OTP code is ${otp}`,
  // });

  const payload = {
    recipients: [internationalizePhoneNumber(phone)], // Extract phone numbers
    message: `One Time Password: ${otp}\n Maretext App.`,
    isFlash: false,
  };

  const response = await axios.post("/api/tasks/sms", payload);

  console.log(`Sending OTP ${otp} to phone ${phone}. Nice`);
}
