import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import Contact from '@/models/Contact';

type RowData = { [key: string]: string | number };

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        const jsonData: RowData[] = [];

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return NextResponse.json({ error: 'No worksheet found' }, { status: 400 });
        }

        let headers: string[] = ['rowId', 'barangay', 'precinct', 'name', 'label', 'remarks', 'wardleader', 'tag'];

        worksheet.eachRow((row, rowNumber) => {
            const rowValues = row.values as Array<string | number | null | undefined>;

            if (rowNumber === 1) {

                // Header row
                headers = rowValues.slice(1).map(h => (typeof h === 'string' ? h.trim() : String(h)));
            } else {
                const rowObject: RowData = {};
                headers.forEach((header, index) => {
                    const cellValue = rowValues[index + 1]?.toString().trim();
                    rowObject[header] = cellValue ?? '';
                });
                jsonData.push(rowObject);
            }
        });


        let contacts = []
        for (const contact of jsonData) {
            console.log(contact, 'CONTACT')
            let tag = contact.label == 'P' ? 'confirm' : contact.label == 'O' ? 'declined' : contact.label == 'D' ? 'undecided' : 'unknown'
            let cont = await Contact.findOne({ name: contact.fullname, precinct: contact.precinct })
            if (cont) {
                if (!cont.tags?.find(a => a.tagType == 'tag')) {
                    contacts.push({ ...contact, name: cont.name, address: cont.address, contId: cont._id, idNum: cont.idNum, marker: cont.marker, tag })
                } else {
                    contacts.push({ ...contact, name: cont.name, address: cont.address, contId: cont._id, idNum: cont.idNum, marker: cont.marker, tag })
                }
            } else {
                contacts.push({ ...contact, tag })
            }
        }




        console.log(jsonData, 'JSON DATA', contacts)
        return NextResponse.json(contacts);

    } catch (error) {
        console.error('Error reading Excel:', error);
        return NextResponse.json({ error: 'Failed to read Excel file' }, { status: 500 });
    }
}

// export async function PUT(request: NextRequest) {
//     try {
//         const { data } = await request.json()

//         if (!data) {
//             return NextResponse.json({ error: 'No data uploaded' }, { status: 400 });
//         }

//     for (const contact of )
//         return NextResponse.json({ data: jsonData });

//     } catch (error) {
//         console.error('Error reading Excel:', error);
//         return NextResponse.json({ error: 'Failed to read Excel file' }, { status: 500 });
//     }
// }
