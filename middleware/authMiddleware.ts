// middleware/authMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Contact, { IContact } from '@/models/Contact';

export async function authMiddleware(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  try {
    // const secretKey = process.env.JWT_SECRET;
    // if (!secretKey) {
    //   throw new Error('JWT_SECRET is not defined in environment variables');
    // }

    // const decoded = jwt.verify(token, secretKey) as { userId: string };

    await dbConnect();

    const user: IContact | null = await Contact.findById(token).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }


    // Attach user to request headers
    const headers = new Headers(req.headers);
    headers.set('X-User', JSON.stringify(user));

    // Create a new request with the updated headers
    const authReq = new NextRequest(req.url, {
      method: req.method,
      headers,
      body: req.body,
      redirect: req.redirect,
      cache: req.cache,
      credentials: req.credentials,
      integrity: req.integrity,
      keepalive: req.keepalive,
      mode: req.mode,
      referrer: req.referrer,
      referrerPolicy: req.referrerPolicy,
    });

    return NextResponse.next({
      request: authReq,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
