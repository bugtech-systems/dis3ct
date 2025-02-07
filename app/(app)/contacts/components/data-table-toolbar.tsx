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
import citymuns from "@/data/regions/refcitymun.json"
import barangays from "@/data/regions/refbrgy.json"
import { useContact } from "@/components/providers/ContactProvider"
import { useEffect, useState } from "react"
import axios from "axios"
import { DataTableToolbarActions } from "./data-table-toolbar-actions"
import { UploadContactForm } from "@/components/contacts/UploadContactForm"


interface DataTableToolbarProps<TData> {
  table: Table<TData>
  selectedRow: any
}

export function DataTableToolbar<TData>({
  table,
  selectedRow = {}
}: DataTableToolbarProps<TData>) {
  const { user } = useContact();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [citymuns, setCitymuns] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const isFiltered = table.getState().columnFilters.length > 0

  let isSelected = Object.keys(selectedRow).length ? true : false;
  let selectedRows = table.getSelectedRowModel().flatRows ? table.getSelectedRowModel().flatRows.map(contact => ({ ...contact.original })) : []

  useEffect(() => {
    axios.get("/api/location/regions").then((res) => {
      setRegions(res.data.data);
    });

    axios.get(`/api/location/provinces`).then((res) => {
      setProvinces(res.data.data);
    });

    axios.get(`/api/location/municipalities`).then((res) => {
      setCitymuns(res.data.data);
    });

    axios.get(`/api/location/barangays`).then((res) => {
      setBarangays(res.data.data);
    });
  }, []);

  const selectedProvinceValues = new Set(table.getColumn("provCode")?.getFilterValue() as string[])
  const selectedCityValues = new Set(table.getColumn("citymunCode")?.getFilterValue() as string[])
  const selectedRegionValues = new Set(table.getColumn("regCode")?.getFilterValue() as string[])



  let regionsOptions = regions.map((region: any) => ({ value: region.regCode, label: region.regDesc, id: region.regDesc }))
  let provincesOptions = provinces.filter((prov: any) => { return selectedRegionValues.size ? selectedRegionValues.has(prov?.regCode) : true }).map((province: any) => ({ value: province.provCode, label: province.provDesc, id: province.provDesc }))
  let citymunOptions = citymuns.filter((mun: any) => { return selectedProvinceValues.size ? selectedProvinceValues.has(mun.provCode) : true }).map((citymun: any) => ({ value: citymun.citymunCode, label: citymun.citymunDesc, id: citymun.citymunDesc }))
  let barangayOptions = barangays.filter((brgy: any) => { return selectedCityValues.size ? selectedCityValues.has(brgy.citymunCode) : true }).map((barangay: any) => ({ value: barangay.brgyCode, label: barangay.brgyDesc, id: barangay.brgyDesc }))



  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter contact..."
          value={(table.getColumn("keyStr")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            table.getColumn("keyStr")?.setFilterValue(event.target.value)
            // table.getColumn("name")?.setFilterValue(event.target.value)
          }
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {(user?.userLevel == 'admin' && table.getColumn("regCode")) && (
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
        {(table.getColumn("citymunCode")) && (
          <DataTableFacetedFilter
            column={table.getColumn("citymunCode")}
            title="City/Municipality"
            options={citymunOptions}
          />
        )}
        {(selectedCityValues.size >= 1 && table.getColumn("brgyCode")) && (
          <DataTableFacetedFilter
            column={table.getColumn("brgyCode")}
            title="Barangay"
            options={barangayOptions}
          />
        )}
        {(user?.userLevel == 'admin' && table.getColumn("userLevel")) && (
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
          <DataTableToolbarActions rows={selectedRows} />
        </div>

        :
        <>
          <UploadContactForm />
          <DataTableViewOptions table={table} />
        </>
      }
    </div>
  )
}
