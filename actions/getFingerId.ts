'use server'

import connectToDatabase from '@/lib/mongodb';
import Fingerprints from '@/models/fingerprints';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const getFingerId = async (userId): Promise<any> => {

    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return [];
        }

        await connectToDatabase();
        let id;
        let exist = false;
        let finger = await Fingerprints.findOne({ user_id: userId });
        let oldFinger = await Fingerprints.find().sort({ biometricId: 1 });

        if (finger) {
            id = finger.biometricId
            exist = true
        } else {
            id = oldFinger.length + 1;
            // let newFinger = await Fingerprints.create({
            //     user_id: userId,
            //     biometricId: id
            // })
            exist = false

        }





        return { id, exist }
    } catch (err) {
        console.log(err, "ERR")
        return null
    }
}

export default getFingerId