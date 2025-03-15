'use server'

import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';
import FingerPrint from '@/models/fingerprints';
import { barangays, regions, provinces, municipalities } from "@/lib/locationData";

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


        if (finger) {
            let contact = await Contact.findById(finger.user_id).lean()

            let barangay = barangays.find((brgy: any) => brgy.brgyCode == contact?.brgyCode)?.brgyDesc;
            let citymun = municipalities.find((citymun: any) => citymun.citymunCode == contact?.citymunCode)?.citymunDesc;
            let province = provinces.find((province: any) => province.provCode == contact?.provCode)?.provDesc;
            let region = regions.find((region: any) => region.regCode == contact?.regCode)?.regDesc;


            return sanitizeObject({ ...contact, barangay, citymun, province, region })
        } else {
            return null
        }



    } catch (err) {
        console.log(err, "ERR")
        return null
    }
}

export default getContactId