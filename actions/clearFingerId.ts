'use server'

import connectToDatabase from '@/lib/mongodb';
import Fingerprints from '@/models/fingerprints';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sanitizeObject } from '@/lib/helpers';
import Contact from '@/models/Contact';

const clearFingerId = async (id): Promise<any> => {

    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return [];
        }

        await connectToDatabase();
        let contact = await Contact.findById(id);

        if (contact && contact.biometric) {
            delete contact.biometric;
            await contact.save()
        }


        return contact
    } catch (err) {
        console.log(err, "ERR")
        return null
    }
}

export default clearFingerId