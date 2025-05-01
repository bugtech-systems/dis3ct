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
        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            return NextResponse.json({ error: 'No worksheet found' }, { status: 400 });
        }

        let headers: string[] = ['barangay', 'precinct', 'name', 'label'];
        const jsonData: RowData[] = [];

        worksheet.eachRow((row, rowNumber) => {
            const rowValues = row.values as Array<string | number | null | undefined>;

            if (rowNumber === 1) {
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

        let contacts: RowData[] = [];
        for (const contact of jsonData) {
            const tag =
                contact.label === 'P' ? 'confirm' :
                    contact.label === 'O' ? 'declined' :
                        contact.label === 'D' ? 'undecided' : 'unknown';

            const cont = await Contact.findOne({
                name: contact.name,
                precinct: contact.precinct,
            });

            if (cont) {
                contacts.push({
                    ...contact,
                    name: cont.name,
                    address: cont.address,
                    contId: cont._id,
                    idNum: cont.idNum,
                    marker: cont.marker,
                    tag,
                });
            } else {
                contacts.push({ ...contact, tag });
            }
        }

        // CREATE a new workbook to send as response
        const resultWorkbook = new ExcelJS.Workbook();
        const resultSheet = resultWorkbook.addWorksheet('Processed Contacts');

        // Set headers
        const allHeaders = Object.keys(contacts[0] || {});
        resultSheet.addRow(allHeaders);

        // Fill in rows
        contacts.forEach(contact => {
            resultSheet.addRow(allHeaders.map(header => contact[header] ?? ''));
        });

        // Write to buffer
        const resultBuffer = await resultWorkbook.xlsx.writeBuffer();

        console.log(contacts, 'CONTACTS')

        return new NextResponse(resultBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="processed_contacts.xlsx"',
            },
        });

    } catch (error) {
        console.error('Error generating Excel:', error);
        return NextResponse.json({ error: 'Failed to generate Excel file' }, { status: 500 });
    }
}
