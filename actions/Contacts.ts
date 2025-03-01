"use server";
import connectToDatabase from '@/lib/mongodb';
import Contact from '@/models/Contact';


import { revalidatePath } from "next/cache";

function toLowercaseKeys(obj: any) {
    return Object.keys(obj).reduce((acc: any, key: any) => {
        acc[key.toLowerCase()] = obj[key];
        return acc;
    }, {});
}


export async function createContact(data: any) {
    try {

        connectToDatabase()


        const contact = await Contact.create(data);
        revalidatePath("/");
        return contact;
    } catch (error) {
        console.log(error);
    }
}

export async function createOrUpdateContact(data: any) {
    try {
        await connectToDatabase();

        // Convert keys to lowercase to maintain consistency
        const formattedData = data as any;


        const referrer = await Contact.findById(data.refNum);

        if (!referrer) {
            return console.log({ error: "Referrer contact not found." }, { status: 400 });
        }

        // Check if a contact with the same name exists (case insensitive)
        const existingContact = await Contact.findOne({ $and: [{ name: new RegExp(`^${formattedData.name}$`, "i") }, { parNum: referrer.parNum }, { deletedAt: null }] });

        if (existingContact) {

            // Update the existing contact
            let refExist = existingContact?.uplines?.find(contact => String(contact) == String(data?.refNum))

            console.log(refExist, data.refNum, 'REFFn', existingContact)
            let contactId = null
            if (!refExist && data.refNum) {
                existingContact?.uplines?.push(data.refNum);
                // existingContact.save();
                formattedData.uplines = existingContact.uplines;

            }

            const updatedContact = await Contact.findByIdAndUpdate(existingContact._id, formattedData, { new: true });
            revalidatePath("/");
            return updatedContact;
        } else {
            console.log('CREATE NEW', formattedData)
            // Create a new contact if not found
            let uplines = referrer?.uplines ? referrer?.uplines : []
            formattedData.uplines = [...uplines, referrer?._id];
            formattedData.parNum = referrer.parNum;
            formattedData.refNum = referrer._id;
            const newContact = await Contact.create(formattedData);
            revalidatePath("/");
            return newContact;
        }
    } catch (error) {
        console.error("Error in createOrUpdateContact:", error);
        return null;

    }
}

export async function createBulkContact(contacts: any) {
    try {
        for (const contact of contacts) {


            await createOrUpdateContact(contact);
        }
    } catch (error) {
        console.log(error);
    }
}