"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/app/(app)/tasks/components/data-table-view-options"

import { priorities, statuses, userLevels } from "../data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { CreateNewMessageForm } from "@/components/contacts/CreateNewMessageForm"
import regions from "@/data/regions/refregion.json"
import provinces from "@/data/regions/refprovince.json"


interface DataTableToolbarProps<TData> {
  table: Table<TData>
  selectedRow: any
}

export function DataTableToolbar<TData>({
  table,
  selectedRow = {}
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

let isSelected = Object.keys(selectedRow).length ? true : false;
let selectedRows = table.getSelectedRowModel().flatRows ? table.getSelectedRowModel().flatRows.map(contact => ({...contact.original})) : []
let regionsOptions = regions.map(region => ({label: region.regDesc, value: region.regCode}))
let provincesOptions = provinces.map(province => ({label: province.provDesc, value: province.provCode}))


  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter contact..."
          value={(table.getColumn("phone")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("phone")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("regCode") && (
          <DataTableFacetedFilter
            column={table.getColumn("regCode")}
            title="Regions"
            options={regionsOptions}
          />
        )} 
        {table.getColumn("provCode") && (
          <DataTableFacetedFilter
            column={table.getColumn("provCode")}
            title="Province"
            options={provincesOptions}
          />
        )} 
         {table.getColumn("userLevel") && (
          <DataTableFacetedFilter
            column={table.getColumn("userLevel")}
            title="User Level"
            options={userLevels}
          />
        )} 
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      {isSelected 
      ?
      <div className="mr-3">
      <CreateNewMessageForm selectedContacts={selectedRows}/>
      </div>
      
      :
      <DataTableViewOptions table={table} />
}
    </div>
  )
}
