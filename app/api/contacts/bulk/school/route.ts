import { NextRequest, NextResponse } from 'next/server';
import { PdfReader } from 'pdfreader';


function parseBarangayData(logs) {
    let barangayData = {};
    let currentBarangay = null;

    let barangayDetected = false;
    let schoolDetected = false;
    let precinctDetected = false;
    let precincts = []
    let brgy = {
        name: '',
        school: null,
        precincts: []
    }


    // Object.values(logs).forEach((line: any) => {
    let lines = Object.values(logs);
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i] as any;
        let oneLine = line.split(',')[0]


        if (!isNaN(line.replace(/,/g, ""))) {
            continue;
        }

        if ((line.includes('NUMBER') && lines[i - 1].includes('PRECINCT')) || line.includes('SUBTOTAL')) {
            // console.log(line, 'L', lines[i - 1], lines[i + 1])
            barangayDetected = true
            continue;
        }


        //     // Stop capturing when "HASH:", "SUBTOTAL", or "Page" markers appear
        if (line.includes("HASH:") || line.includes("Election Officer") || line.includes("SUBTOTAL") || line.includes("Page") || line.includes("Date")) {
            barangayDetected = false;
            schoolDetected = false;
            precinctDetected = false;
            // barangayData[currentBarangay] = brgy
            continue;
        }

        if (barangayDetected) {
            currentBarangay = line.trim();

            if (brgy.name != currentBarangay) {

                brgy = {
                    name: '',
                    school: null,
                    precincts: []
                }
                brgy.name = currentBarangay;
                brgy.precincts = barangayData[currentBarangay] ? barangayData[currentBarangay].precincts : []
                barangayData[currentBarangay] = brgy;

            }


            barangayDetected = false;
            precinctDetected = true;
            schoolDetected = true;
            continue;
        }


        if (precinctDetected && /^\d{4}[A-Z]$/.test(oneLine)) {
            if (!brgy.precincts.find(pr => pr == oneLine)) {
                brgy.precincts.push(oneLine)
            }
            continue;
        }

        if (schoolDetected) {
            if (brgy.school) {
                brgy.school += ` ${line}`
            } else {
                brgy.school = line
            }

        }

        //     // Start capturing when a valid header appears


    }

    // });


    return barangayData;
}

// Example usage
// const logData = `YOUR LOG DATA HERE`; // Replace with actual log data



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
        let logs = '';

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
                    logs += `${item.text} \n`;

                    row.push(item.text);

                    // console.log(item.text)

                    /*       if (isPcvl) {
      
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
       */


                    rows[item.y] = row;






                }
            });
        });




        // console.log(rows, 'ITEM', table)

        let brgyData = await parseBarangayData(table);
        // console.log(brgyData, 'BAR DATA')
        let contacts = Object.entries(brgyData).map(([key, value]: any) => {
            // console.log(key, value)
            return { barangay: key, ...value }
        })



        // let contacts = brgyData;
        // console.log(contacts.length, 'LEN')

        return NextResponse.json(
            contacts,
            { status: 200 }
        );



    } catch (error) {
        console.log('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}

