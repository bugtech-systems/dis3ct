'use server'

import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import FingerPrint from '@/models/fingerprints';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sanitizeObject } from '@/lib/helpers';

const getContactId = async (id): Promise<any> => {

    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return [];
        }


        await connectToDatabase();
        let finger = await FingerPrint.findOne({ biometricId: Number(id) }).select('user_id biometricId');

        console.log('GET Finger', finger)

        if (finger) {
            let contact = await Contact.findById(finger.user_id).lean()

            return sanitizeObject(contact)
        } else {
            return null
        }



    } catch (err) {
        console.log(err, "ERR")
        return null
    }
}

export default getContactId