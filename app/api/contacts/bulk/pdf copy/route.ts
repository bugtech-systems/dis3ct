import { NextRequest, NextResponse } from 'next/server';
import { PdfReader } from 'pdfreader';


function removeLastObject(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
        return [];
    }
    arr.pop(); // Removes and returns the last object
    return arr;
}


function getLegendDescriptions(value) {
    const legends = {
        "*": "18-30",
        "A": "Illiterate",
        "B": "PWD",
        "C": "Senior Citizen",
        "D": "Indigenous People"
    };

    return value.replace(/\s+/g, '') // Remove spaces
        .split('') // Split into individual characters
        .map(char => legends[char] || "Unknown") // Map to descriptions
        .join(", "); // Join descriptions with ", "
}
export async function POST(req: NextRequest) {
    try {
        // Ensure the request is a POST
        if (req.method !== 'POST') {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }

        // Parse the form data
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const parNum = formData.get('parNum');
        const refNum = formData.get('refNum');
        const regCode = formData.get('regCode');
        const provCode = formData.get('provCode');
        const citymunCode = formData.get('citymunCode');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }




        // Read ZIP file buffer
        const buffer = Buffer.from(await file.arrayBuffer());




        const rows: { [key: string]: string[] } = {};
        const pdfReader = new PdfReader();
        let table = {};
        let recInd = null;
        let ind = 0;
        let activeNo = null;
        let inc = null;
        let isPcvl = false;
        let rowData = {
            number: null,
            name: null,
            address: null,
            marker: null
        };
        let records = [];
        let precinct = null;
        let area = {
            barangay: null,
            province: null,
            city: null
        };

        await new Promise<void>((resolve, reject) => {
            pdfReader.parseBuffer(buffer, (err, item) => {
                if (err) {
                    reject(err);
                } else if (!item) {
                    resolve();
                } else if (item.text) {
                    const row = rows[item.y] || [];
                    ind++;
                    table[ind] = item.text;

                    if (String(item.text).toLowerCase().includes('pcvl')) {
                        inc = item.text;
                        isPcvl = true;
                    }







                    row.push(item.text);


                    if (isPcvl) {

                        //CHECK PCVL
                        if (String(item.text).toLowerCase().trim().includes('date:') || String(item.text).includes('page') || String(item.text).toLowerCase().trim().includes('nameandsignature')) {
                            activeNo = null;
                            inc = null;
                            isPcvl = false;
                            return
                        } else if (inc == 'PCVL' && !isNaN(Number(item.text))) {
                            activeNo = item.text;
                            inc = 'number';

                            rowData = {
                                number: item.text,
                                name: null,
                                address: null,
                                marker: null
                            }
                        } else if (inc == 'number') {
                            rowData.address = item.text;
                            inc = 'address';

                        } else if (inc == 'address') {

                            if (String(item.text).split(',')[1]) {
                                rowData.name = item.text;
                                inc = 'name';
                                records.push({ ...rowData, ...area, precinct });
                            } else {
                                rowData.address = rowData.address + ' ' + item.text;
                            }


                        } else if ((inc == 'name' && isNaN(Number(item.text)))) {
                            // let rowDoc = records[records.length - 1]

                            if (String(item.text).length < 4) {
                                rowData.marker = getLegendDescriptions(item.text);
                                inc = 'marker';
                            } else {
                                rowData.address = rowData.address + ' ' + rowData.name;
                                rowData.name = item.text;
                            }

                            // records[recInd - 1] = { ...rowData, ...area, precinct };
                        } else if ((inc == 'name' || inc == 'marker') && (Number(activeNo) + 1) == Number(item.text)) {
                            activeNo = item.text;
                            inc = 'number';

                            const result = removeLastObject(records);
                            records = result;
                            records.push({ ...rowData, ...area, precinct });
                            rowData = {
                                number: item.text,
                                name: null,
                                address: null,
                                marker: null
                            }
                        }
                    } else {
                        rowData = {
                            number: null,
                            name: null,
                            address: null,
                            marker: null
                        }


                        if (inc == 'barangay') {
                            area.barangay = item.text;
                            inc = null;
                        } else if (inc == 'city') {
                            area.city = item.text;
                            inc = null;
                        } else if (inc == 'province') {
                            area.province = item.text;
                            inc = null;
                        }







                        if (String(item.text).toLowerCase().trim().includes('barangay :')) {
                            inc = 'barangay';
                        } else if (String(item.text).toLowerCase().trim().includes('city / municipality :')) {
                            inc = 'city';
                        } else if (String(item.text).toLowerCase().trim().includes('province :')) {
                            inc = 'province';
                        } else if (String(item.text).toLowerCase().trim().includes('prec :')) {
                            precinct = String(item.text).replace('Prec : ', '');
                        }






                    }



                    // rows[item.y] = row;






                }
            });
        });






        let contacts = records.map((row) => {
            return { ...row, idNum: row.number }
        })




        // console.log(contacts[contacts.length - 1])

        return NextResponse.json(
            contacts,
            { status: 200 }
        );



    } catch (error) {
        console.log('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}
