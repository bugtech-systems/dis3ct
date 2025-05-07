import { utils, write, writeFile } from 'xlsx';
import { saveAs } from "file-saver";

/**
 * Exports data as an Excel file (.xlsx)
 * @param data - The array of objects to export
 * @param fileName - The name of the file to be downloaded
 */

export function exportToExcel<T>(data: T[], fileName: string = 'export.xlsx'): void {
    // Convert JSON data to a worksheet

    const worksheet = utils.json_to_sheet(data);

    // Create a new workbook and append the worksheet
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Write the workbook to a file
    writeFile(workbook, fileName);
}

/**
 * Exports data as a CSV file (.csv)
 * @param data - The array of objects to export
 * @param fileName - The name of the file to be downloaded
 */
export function exportToCSV<T>(data: T[], fileName: string = 'export.csv'): void {
    // Convert JSON data to a worksheet
    const worksheet = utils.json_to_sheet(data);
    // Generate CSV output from the worksheet
    const csvOutput = write(
        { Sheets: { data: worksheet }, SheetNames: ['data'] },
        { bookType: 'csv', type: 'array' }
    );

    // Create a Blob from the CSV output
    const csvBlob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });

    // Use FileSaver.js to save the CSV file
    saveAs(csvBlob, fileName);
}
