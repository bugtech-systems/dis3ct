// utils/otp.ts
import crypto from 'crypto';

export function generateOTP(length: number = 6): string {
  const otp = crypto.randomInt(0, 10 ** length).toString().padStart(length, '0');
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
