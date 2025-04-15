import { NextRequest, NextResponse } from "next/server";
import Contact from "@/models/Contact";
import Fingerprint from "@/models/fingerprints";

export const POST = async (req: NextRequest) => {
    try {
        const data = await req.json()
        let { contactId } = data;
        let contact = await Contact.findById(contactId);

        if (contact) {

            let tags = contact?.tags ? contact.tags : [];

            let newTags = tags.filter(a => a.tagType != 'biometrics');


            contact.tags = newTags;

            if (contact.biometric) {
                await Fingerprint.deleteMany({ user_id: String(contact._id) })
                await Fingerprint.deleteOne({ _id: String(contact.biometric) })
                contact.biometric = undefined;
            }
            contact.save();
        }

        console.log(contact, 'CONTACT CLEAR')
        return NextResponse.json(contact, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
};
