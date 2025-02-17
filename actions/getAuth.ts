'use server';

import connectToDatabase from '@/lib/mongodb';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Contact from '@/models/Contact';

const getAuth = async (): Promise<any> => {

  try {

    const session = await getServerSession(authOptions) as any;

    if (!session || !session.user) {
      return null;
    }

    const userId = session.user.id;

    await connectToDatabase()


    const user = await Contact.findById(userId).lean();
    return user
  } catch (err) {
    console.log(err, 'ERROR')
    return null
  }
}

export default getAuth