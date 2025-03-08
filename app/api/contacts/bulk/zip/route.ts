import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { PdfReader } from 'pdfreader';
import path from 'path';
import AdmZip from "adm-zip";
import axios from 'axios';
import Contact from '@/models/Contact';



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
        const replaceStr = formData.get('replaceStr') || "";
        const removeStr = formData.get('removeStr') || null;


        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const extractName = String(file.name).replace('.zip', '')



        // Read ZIP file buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);

        // Define extraction path
        const uploadDir = path.join(process.cwd(), "public/uploads");

        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Extract files
        zip.extractAllTo(uploadDir, true);

        // Read extracted files
        const files = fs.readdirSync(uploadDir);

        let zipFile = path.join(uploadDir, extractName)
        const zipFiles = fs.readdirSync(zipFile);
        let totalVotres = 0;



        let barReq = await axios.get(`http://localhost:3000/api/location/barangays/${citymunCode}`)


        let barangays = barReq.data.data;
        // let filenamesToMatch = barangays.map((brgy) => brgy.brgyDesc);
        // Helper function to normalize filenames
        const normalizeString = (str) => {
            return str.toLowerCase()
                .replace(/[^a-z0-9]/g, "");  // Remove all non-alphanumeric characters
        };

        const replaceString = (str) => {
            let newStr = str;
            let remStr = String(removeStr).split(',');
            remStr.forEach(rm => {
                newStr = String(newStr).toLowerCase().replace(String(rm).toLowerCase(), replaceStr)
            })
            return newStr;  // Remove all non-alphanumeric characters
        };


        // Function to find matching object based on normalized filename
        const findMatchingObject = (filename, dataArray) => {
            const normalizedFilename = normalizeString(filename);

            return dataArray.find((obj) => {
                const normalizedField = normalizeString(replaceString(obj.brgyDesc)); // Adjust field name accordingly
                let spltFile = String(filename).split('_').map(splt => { return normalizeString(splt) })
                return (normalizedFilename === normalizedField || spltFile.includes(normalizedField));
            });
        };



        // Simulate reading files from an extracted ZIP folder

        // Iterate over extracted files and find matching objects

        // Filter only PDF files
        const pdfFiles = zipFiles.filter(file => file.endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            return NextResponse.json({ message: 'No PDF files found' }, { status: 200 });
        }

        for (const filename of pdfFiles) {
            let cleanName = replaceString(filename)

            const filePath = path.join(uploadDir, extractName, filename);
            const matchingObject = findMatchingObject(cleanName, barangays);
            let bar = barangays.find((brgy) => normalizeString(brgy.brgyDesc).includes(normalizeString(cleanName)))




            if ((matchingObject || bar)) {
                let brgyCode = matchingObject ? matchingObject.brgyCode : bar.brgyCode
                const fileBuffer = fs.readFileSync(filePath); // Read file as buffer
                // Read the file as an ArrayBuffer
                // const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(fileBuffer);



                const rows: { [key: string]: string[] } = {};
                const pdfReader = new PdfReader();
                let table = {};
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
                                    rowData.name = item.text;
                                    inc = 'name';
                                } else if ((inc == 'name' && isNaN(Number(item.text)))) {
                                    if (String(item.text).length < 4) {
                                        rowData.marker = getLegendDescriptions(item.text);
                                        inc = 'marker';
                                    } else {
                                        rowData.address = rowData.address + ' ' + rowData.name;
                                        rowData.name = item.text;
                                    }

                                } else if (((inc == 'name' || inc == 'marker') && (Number(activeNo) + 1) == Number(item.text))) {
                                    activeNo = item.text;
                                    inc = 'number'

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



                            rows[item.y] = row;






                        }
                    });
                });





                totalVotres += records.length;

                let contacts = records.map((row) => {
                    return { ...row, idNum: row.number }
                })



                const existingContacts = await Contact.find({
                    $or: contacts.map(({ idNum, name }) => ({ idNum, name, refNum })),
                }).select("idNum name").lean();

                const existingSet = new Set(existingContacts.map((c) => `${c.idNum}-${c.name}`));

                // // Separate new contacts from duplicates
                const newContacts = contacts.filter(
                    (contact) => !existingSet.has(`${contact.idNum}-${contact.name}`)
                );


                let allContacts = newContacts.map((contact) => {
                    return { ...contact, regCode, provCode, citymunCode, brgyCode, parNum, refNum, uplines: [parNum, refNum] }
                });

                if (allContacts.length > 0) {
                    await Contact.insertMany(allContacts);

                }







            }



            // // Extract unique identifiers







        }











        // fs.rmSync(uploadDir, { recursive: true, force: true });



        return NextResponse.json({ message: 'Upload Successfully', totalVotres }, { status: 200 });



    } catch (error) {
        console.log('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}
