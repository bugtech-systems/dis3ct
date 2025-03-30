'use server'

import connectToDatabase from '@/lib/mongodb';
import Fingerprints from '@/models/fingerprints';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { sanitizeObject } from '@/lib/helpers';
import Contact from '@/models/Contact';

const clearFingerId = async (id): Promise<any> => {

    try {


        await connectToDatabase();
        let contact = await Contact.findById(id);

        if (contact && contact.biometric) {
            contact.biometric = undefined;
            await contact.save()
            let finger = await Fingerprints.findOne({ user_id: String(contact._id) })
            if (finger) {
                await Fingerprints.findByIdAndDelete(finger._id)
            }
        }



        console.log(contact, 'CCC')
        return sanitizeObject(contact)
    } catch (err) {
        console.log(err, "ERR")
        return null
    }
}

export default clearFingerId