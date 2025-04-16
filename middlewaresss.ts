import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';

export async function middleware(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  //   const decoded = verifyToken(token);



  if (!token) {
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 403 });
  }

  //   await connectToDatabase();
  //   const user = await Contact.findById(token).select('-otpCode');

  //   if (!user) {
  //     return NextResponse.json({ message: 'User not found' }, { status: 404 });
  //   }

  req.headers.set('Auth-User', token);

  return NextResponse.next();
}



export const config = {
  matcher: [
    '/api/contacts',
    '/contacts', '/playground', '/tasks'], // Add all routes that require authentication
};
