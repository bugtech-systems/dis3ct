'use server';

import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Contact from '@/models/Contact';
import { sanitizeObject } from '@/lib/helpers';
import User from '@/models/User';

const getAuth = async (): Promise<any> => {
  try {
    const session = await getServerSession(authOptions) as any;

    if (!session || !session.user) {
      return null;
    }

    const userId = session.user.id;
    await connectToDatabase();

    // Ensure `parNum` is populated only if it exists
    const user = await User.findById(userId).populate([{
      path: 'parent',
      options: { strictPopulate: false } // Allows missing `parNum` without errors
    }, {
      path: 'contact',
      options: { strictPopulate: false } // Allows missing `parNum` without errors
    }]);

    return sanitizeObject(user);
  } catch (err) {
    console.log(err, 'ERROR');
    return null;
  }
};


export default getAuth