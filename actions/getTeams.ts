'use server';

import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sanitizeObject } from '@/lib/helpers';

const getTeams = async (id: any): Promise<any[]> => {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user) {
      return [];
    }

    const userId = session.user.id;
    await connectToDatabase();


    let query: any = {}; // Exclude the authenticated user

    const user = await User.findById(id).lean();


    if (!user) return [];

    switch (user.userType) {
      case 'admin':
        query.deletedAt = null;
        // query.refNum = user._id;
        break;
      case 'system':
        query.refNum = user._id;
        query.parent = user._id;
        break;
      case 'leader':
        query.refNum = user._id;
        query.parent = user.parent;
        break;
      default:
        return []; // Return empty if userType doesn't match
    }




    const teams = await User.find(query).populate([{
      path: 'parent',
      options: { strictPopulate: false } // Allows missing `parNum` without errors
    }, {
      path: 'contact',
      options: { strictPopulate: false } // Allows missing `parNum` without errors
    }]).select('name phone userType configs username accessCode accessCodes accessLevel').lean();

    return sanitizeObject(teams);
  } catch (err) {
    console.error("Error fetching team members:", err);
    return [];
  }
};

export default getTeams;
