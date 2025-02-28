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

        let fileContents: { name: string; content: string }[] = [];



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


        let abnormalFiles = [];
        let validFiles = [];

        zipFiles.forEach((filename) => {
            let pdfFile = replaceString(filename);
            const filePath = path.join(uploadDir, extractName, filename);
            const stats = fs.statSync(filePath);
            const matchingObject = findMatchingObject(pdfFile, barangays);

            if (!matchingObject) {
                let bar = barangays.find((brgy) => normalizeString(brgy.brgyDesc).includes(normalizeString(pdfFile)))
                if (!bar) {
                    abnormalFiles.push(filename);
                } else {
                    let { brgyDesc } = bar;
                    validFiles.push({ filename, brgyDesc })
                }
            } else {
                let { brgyDesc } = matchingObject;
                validFiles.push({ filename, brgyDesc })
            }
        });





        fs.rmSync(zipFile, { recursive: true, force: true });



        return NextResponse.json({ abnormalFiles, validFiles, zipFile }, { status: 200 });



    } catch (error) {
        console.log('Error processing PDF:', error);
        return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
    }
}
