"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { ScannerForm } from "@/components/scanner";
import { useDebounce } from "@/hooks/useDebounce";
import { useContact } from "@/components/providers/ContactProvider";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[]; // All data is preloaded
}

export default function CardsDataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const { user, system } = useContact();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10); // Default 10 rows per page
  const [search, setSearch] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState({});
  /*  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
     [],
   ); */
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    phone: false,
    province: false,
    citymun: false,
    barangay: false,
    address: true, // Hide address column by default.
    region: false,
    activePreset: false,
    keyStr: false,
  });

  // const debouncedSearch = useDebounce(search, 500);

  // Filter data based on search input
  // const filteredData = React.useMemo(() => {
  //   if (!debouncedSearch) return data;
  //   return data.filter((item: any) =>
  //     Object.values(item).some((value) =>
  //       String(value).toLowerCase().includes(debouncedSearch.toLowerCase())
  //     )
  //   );
  // }, [debouncedSearch, data]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      // columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    // onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),

    /*   getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      onSortingChange: setSorting,
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      getFilteredRowModel: getFilteredRowModel(), // ✅ REQUIRED for filtering
      enableRowSelection: true,
      state: {
        sorting,
        columnVisibility,
        rowSelection,
        pagination: { pageIndex, pageSize },
      }, */
  }, [data]);



  return (
    <div className="space-y-4">
      <DataTableToolbar selectedRow={rowSelection} table={table} />
      <ScannerForm />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
