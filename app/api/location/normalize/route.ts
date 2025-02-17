import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { PdfReader } from 'pdfreader';
import ExcelJS from 'exceljs';
import path from 'path';
import AdmZip from "adm-zip";
import axios from 'axios';



function isNumber(value) {
    return typeof value === "number";
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
        console.log(formData, 'FORM')
        const file = formData.get('file') as File;
        const parNum = formData.get('parNum');
        const refNum = formData.get('refNum');
        const regCode = formData.get('regCode');
        const provCode = formData.get('provCode');
        const citymunCode = formData.get('citymunCode');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }


        console.log(parNum, refNum, regCode, provCode, citymunCode, 'DATA')


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
        let zipFile = path.join(uploadDir, files[0])
        const zipFiles = fs.readdirSync(zipFile);

        let fileContents: { name: string; content: string }[] = [];



        let barReq = await axios.get(`http://localhost:3000/api/location/barangays/${citymunCode}`)


        let barangays = barReq.data.data;
        // let filenamesToMatch = barangays.map((brgy) => brgy.brgyDesc);
        // Helper function to normalize filenames
        const normalizeString = (str) => {
            return str.toLowerCase()
                .replace(/[^a-z0-9]/g, "");  // Remove all non-alphanumeric characters
        };
        // Normalize filenames in `filenamesToMatch`


        // console.log(barangays, 'BARANGAYS');

        // Function to find matching object based on normalized filename
        const findMatchingObject = (filename, dataArray) => {
            const normalizedFilename = normalizeString(filename);

            return dataArray.find((obj) => {
                const normalizedField = normalizeString(obj.brgyDesc); // Adjust field name accordingly
                // console.log(normalizedFilename, normalizedField)

                return normalizedFilename === normalizedField;
            });
        };



        // Simulate reading files from an extracted ZIP folder

        // Iterate over extracted files and find matching objects


        console.log(barangays.length, 'FILES', zipFiles.length)
        let abnormalFiles = [];
        zipFiles.forEach((filename) => {
            let pdfFile = String(filename).replace("_PCVL_MAY_12_2025_NLE.pdf", "")
            const filePath = path.join(uploadDir, files[0], filename);
            const stats = fs.statSync(filePath);
            const matchingObject = findMatchingObject(pdfFile, barangays);

            if (!matchingObject) {
                let bar = barangays.find((brgy) => normalizeString(brgy.brgyDesc).includes(normalizeString(pdfFile)))
                if (!bar) {
                    abnormalFiles.push(filename)
                }
            }
        });








        return NextResponse.json({ abnormalFiles, zipFile }, { status: 200 });



    } catch (error) {
        console.log('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}
