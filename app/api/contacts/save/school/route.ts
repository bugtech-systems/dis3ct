import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import Contact from '@/models/Contact';
import connectToDatabase from '@/lib/mongodb';



export const POST = async (req: NextRequest) => {
    console.log('wewew')
    try {



        await connectToDatabase();

        const { data, parNum } = await req.json();
        console.log(data, 'UPDATES')
        if (!Array.isArray(data)) {
            return NextResponse.json({ error: 'Invalid payload format' }, { status: 405 });
        }

        const bulkOps = [];

        data.forEach(({ barangay, school, precincts }) => {
            if (!barangay || !school || !Array.isArray(precincts)) return;

            bulkOps.push({
                updateMany: {
                    filter: { precinct: { $in: precincts }, parNum },
                    update: { $set: { school } },
                },
            });
        });

        if (bulkOps.length > 0) {
            await Contact.bulkWrite(bulkOps);
        }


        // let contacts = brgyData;
        // console.log(contacts.length, 'LEN')

        return NextResponse.json({ message: 'Updated Successfully!' },
            { status: 200 }
        );



    } catch (error) {
        console.log('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}

