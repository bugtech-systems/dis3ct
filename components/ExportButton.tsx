import { exportToExcel, exportToCSV } from "@/utils/exportData";
import { FileDownIcon } from "lucide-react";

interface DataItem {
  id: number;
  name: string;
  age: number;
  city: string;
}

export default function ExportButton({ data }: { data: any }) {
  // const sampleData: DataItem[] = [
  //   { id: 1, name: "John Doe", age: 30, city: "New York" },
  //   { id: 2, name: "Jane Smith", age: 25, city: "Los Angeles" },
  // ];

  return (
    <div className="flex space-x-4">
      <button
        type="button"
        className="flex items-center justify-center text-sm font-medium rounded-md px-3 h-8 gap-1  hover:text-white border hover:bg-primary focus:ring-4 focus:outline-none focus:ring-primary py-2.5 text-center me-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800 disabled:opacity-50"
        onClick={() => exportToExcel(data, "exported.xlsx")}
      >
        <FileDownIcon />
        Export
      </button>
    </div>
  );
};

// export default ExportButton;
