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
import RefreshButton from "@/components/RefreshButton"

let tagsLabel = [{ label: 'Confirmed', value: 'confirm' }, { label: 'Undecided', value: 'undecided' }, { label: 'Declined', value: 'declined' }, { label: 'Unknown', value: undefined }];

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  selectedRow: any
}

export function DataTableToolbar<TData>({
  table,
  selectedRow = {}
}: DataTableToolbarProps<TData>) {
  const { user, system } = useContact();
  const [barangays, setBarangays] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");



  const isFiltered = table.getState().columnFilters.length > 0

  let isSelected = Object.keys(selectedRow).length ? true : false;
  let selectedRows = table.getSelectedRowModel().flatRows ? table.getSelectedRowModel().flatRows.map(contact => ({ ...contact.original })) : []


  useEffect(() => {
    if (system) {
      axios.get(`/api/location/access?code=${system?.accessCode}&level=${system?.accessLevel}`).then((res) => {
        if (res.data) {
          let { regCode, provCode, citymunCode, brgyCode } = res.data;
          // setSelectedRegion(regCode)
          setSelectedProvince(provCode)
          setSelectedMunicipality(citymunCode)
        }
      });
    }

  }, [system]);

  useEffect(() => {
    // axios.get("/api/location/regions").then((res) => {
    //   setRegions(res.data.data);
    // });

    // axios.get(`/api/location/provinces`).then((res) => {
    //   setProvinces(res.data.data);
    // });

    // axios.get(`/api/location/municipalities`).then((res) => {
    //   setCitymuns(res.data.data);
    // });

    if (selectedMunicipality) {
      axios.get(`/api/location/barangays/${selectedMunicipality}`).then((res) => {
        setBarangays(res.data.data);
      });
    }
  }, [selectedMunicipality]);

  const selectedProvinceValues = new Set(table.getColumn("province")?.getFilterValue() as string[])
  const selectedCityValues = new Set(table.getColumn("citymun")?.getFilterValue() as string[])
  const selectedBrgyValues = new Set(table.getColumn("barangay")?.getFilterValue() as string[])
  const selectedRegionValues = new Set(table.getColumn("region")?.getFilterValue() as string[])
  const selectedTagValues = new Set(table.getColumn("tag")?.getFilterValue() as string[])

  const column = table.getColumn("precinct"); // Replace with your column accessorKey


  let barangayOptions = barangays.filter((brgy: any) => { return selectedCityValues.size ? selectedCityValues.has(brgy.citymunDesc) : true }).map((barangay: any) => ({ value: barangay.brgyDesc, label: barangay.brgyDesc, id: barangay.brgyDesc }))
  let precinctOptions = [...column?.getFacetedUniqueValues().keys()].map(row => {
    return { value: row, label: row, id: row }
  });




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
        {/* {(user?.userLevel == 'admin' && table.getColumn("region")) && (
          <DataTableFacetedFilter
            column={table.getColumn("region")}
            title="Regions"
            options={regionsOptions}
          />
        )}
        {table.getColumn("province") && (
          <DataTableFacetedFilter
            column={table.getColumn("province")}
            title="Province"
            options={provincesOptions}
          />
        )}
        {(table.getColumn("citymun")) && (
          <DataTableFacetedFilter
            column={table.getColumn("citymun")}
            title="City/Municipality"
            options={citymunOptions}
          />
        )} */}
        {((selectedMunicipality && table.getColumn("barangay")) && user.accessLevel != 'brgyCode') && (
          <DataTableFacetedFilter
            column={table.getColumn("barangay")}
            title="Barangay"
            options={barangayOptions}
          />
        )}

        {(selectedBrgyValues.size >= 1 && table.getColumn("precinct")) && (
          <DataTableFacetedFilter
            column={table.getColumn("precinct")}
            title="Precinct"
            options={precinctOptions}
          />
        )}
        {(table.getColumn("tag")) && (
          <DataTableFacetedFilter
            column={table.getColumn("tag")}
            title="Label"
            options={tagsLabel}
          />
        )}
        {/* {(user?.userLevel == 'admin' && table.getColumn("userLevel")) && (
          <DataTableFacetedFilter
            column={table.getColumn("userLevel")}
            title="User Level"
            options={userLevels}
          />
        )} */}
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
      <div className="flex">
        <RefreshButton />

        {isSelected
          ?
          <div className="mr-3">
            <DataTableToolbarActions rows={selectedRows} />
          </div>

          :
          <>
            {user?.userType == 'admin' &&
              <UploadContactForm />
            }
            <DataTableViewOptions table={table} />
          </>
        }
      </div>
    </div>
  )
}
