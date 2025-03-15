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
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { useContact } from "@/components/providers/ContactProvider";
import { DataTableToolbar } from "./data-table-toolbar";
import { useComponent } from "@/components/providers/ComponentContext";


// Debounce function
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
}

export default function CardsDataTable<TData, TValue>({ columns }: DataTableProps<TData, TValue>) {
  const { user, parentSystem, contactTable, setContactTable } = useContact();
  const { setIsRefreshing, refreshId } = useComponent();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState({});
  const [totalPages, setTotalPages] = React.useState(0);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    phone: false,
    subscrip: false,
    province: false,
    citymun: false,
    barangay: false,
    address: true,
    region: false,
    activePreset: false,
    subscribed: false,
    school: false,
    keyStr: false,
    brgyCode: false,
    citymunCode: false
  });


  const debouncedSearch = useDebounce(search, 2000);


  const table = useReactTable({
    data: contactTable,
    columns,
    state: { sorting, columnVisibility, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true, //turn off client-side pagination
    // onPaginationChange: ({ }) => {
    //   // console.log(updater)
    //   setPageIndex(pageIndex);
    //   setPageSize(pageSize);
    // },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });





  React.useEffect(() => {
    setIsRefreshing(true)
    const fetchData = async () => {
      try {
        const params = {
          userId: parentSystem ? parentSystem?._id : user?._id,
          page: pageIndex + 1,
          limit: pageSize,
          search: debouncedSearch,
          ...(filters?.tags ? { tags: filters?.tags.join(',') } : {}),
          ...(filters?.brgyCode ? { brgyCode: filters?.brgyCode.join(',') } : {}),
          ...(filters?.precincts ? { precincts: filters?.precincts.join(',') } : {}),

        };

        const response = await axios.get("/api/contacts", { params });
        setContactTable(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setIsRefreshing(false)

      } catch (error) {
        setIsRefreshing(false)
        console.error("Error fetching data:", error);
      }
    };

    if (parentSystem) {
      fetchData();
    }

  }, [parentSystem, pageIndex, pageSize, debouncedSearch, filters, refreshId]);

  return (
    <div className="space-y-4">
      <DataTableToolbar setFilters={setFilters} setSearch={setSearch} table={table} search={search} />
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
      <DataTablePagination table={table} totalPages={totalPages} setPageSize={setPageSize} setPageIndex={setPageIndex} />
    </div>
  );
}