"use client"

import { ColumnDef } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

import regions from "@/data/regions/refregion.json"
import provinces from "@/data/regions/refprovince.json"
import municipalities from "@/data/regions/refcitymun.json"
import barangays from "@/data/regions/refbrgy.json"
// import { barangays } from "@/lib/locationData";

import { Contact } from "../data/schema"


let regionsOptions = regions.map(region => ({ label: region.regDesc, value: region.regCode }))
let provincesOptions = provinces.map(province => ({ label: province.provDesc, value: province.provCode }))
let municipalitiesOptions = municipalities.map(mun => ({ label: mun.citymunDesc, value: mun.citymunCode }))
// let barangaysOptions = barangays.map((brgy: any) => ({ label: brgy.brgyDesc, value: brgy.brgyCode }));



export const columns: ColumnDef<Contact>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      // const label = labels.find((label) => label.value === row.original.label)

      return (
        <div className="flex space-x-2">
          {/*        {label && <Badge variant="outline">{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium"> */}
          {row.getValue("name")}
          {/* </span> */}
        </div>
      )
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("phone")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "userLevel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Access Level" />
    ),
    cell: ({ row }) => {
      // const label = labels.find((label) => label.value === row.original.label)

      return (
        <div className="flex space-x-2">
          {/*        {label && <Badge variant="outline">{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium"> */}
          {row.getValue("userLevel")}
          {/* </span> */}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    cell: ({ row }) => {
      // const label = labels.find((label) => label.value === row.original.label)

      return (
        <div className="flex space-x-2">
          {/*        {label && <Badge variant="outline">{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium"> */}
          {row.getValue("address")}
          {/* </span> */}
        </div>
      )
    },
  },
  {
    accessorKey: "region",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Region" />
    ),
    cell: ({ row }) => {

      return (
        <div className="flex space-x-2">
          {/* {       label && <Badge variant="outline">{label.label}</Badge>} */}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("region")}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "province",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Province" />
    ),
    cell: ({ row }) => {

      return (
        <div className="flex space-x-2">
          {/* {       label && <Badge variant="outline">{label.label}</Badge>} */}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("province")}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "citymun",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="City/Municipality" />
    ),
    cell: ({ row }) => {

      return (
        <div className="flex space-x-2">
          {/* {       label && <Badge variant="outline">{label.label}</Badge>} */}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("citymun")}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "barangay",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barangay" />
    ),
    cell: ({ row }) => {

      return (
        <div className="flex space-x-2">
          {/* {       label && <Badge variant="outline">{label.label}</Badge>} */}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("barangay")}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "regCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reg Code" />
    ),
    cell: ({ row }) => {

      return (
        <div className="flex space-x-2">
          {/* {       label && <Badge variant="outline">{label.label}</Badge>} */}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("regCode")}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "provCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prov Code" />
    ),
    cell: ({ row }) => {

      return (
        <div className="flex space-x-2">
          {/* {       label && <Badge variant="outline">{label.label}</Badge>} */}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("provCode")}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "citymunCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="City Code" />
    ),
    cell: ({ row }) => {

      return (
        <div className="flex space-x-2">
          {/* {       label && <Badge variant="outline">{label.label}</Badge>} */}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("citymunCode")}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "brgyCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Barangay Code" />
    ),
    cell: ({ row }) => {

      return (
        <div className="flex space-x-2">
          {/* {       label && <Badge variant="outline">{label.label}</Badge>} */}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("brgyCode")}
          </span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: "subscribed",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subscribed" />
    ),
    cell: ({ row }) => {
      // const label = labels.find((label) => label.value === row.original.label)

      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className={`${row.getValue("subscribed") ? 'bg-green-400' : 'bg-inherit'} font-medium`}>{row.getValue("subscribed") ? "YES" : "NO"}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "activePreset",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Preset" />
    ),
    cell: ({ row }) => {
      // const label = labels.find((label) => label.value === row.original.label)

      return (
        <div className="flex space-x-2">
          {row.getValue("activePreset")}
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
