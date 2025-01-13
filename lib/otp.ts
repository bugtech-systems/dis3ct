// utils/otp.ts
import { sanitizePhoneNumber } from '@/lib/helpers';
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
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
  console.log(`Sending OTP ${otp} to phone ${phone}`);
}
