"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/app/(app)/tasks/components/data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { CreateNewMessageForm } from "@/components/contacts/CreateNewMessageForm";
import { useContact } from "@/components/providers/ContactProvider";
import { useEffect, useState } from "react";
import axios from "axios";
import { DataTableToolbarActions } from "./data-table-toolbar-actions";
import { UploadContactForm } from "@/components/contacts/UploadContactForm";
import RefreshButton from "@/components/RefreshButton";
import { useComponent } from "@/components/providers/ComponentContext";


const tagsLabel = [
  { label: "CONFIRMED", value: "confirm" },
  { label: "UNDECIDED", value: "undecided" },
  { label: "DECLINED", value: "declined" },
  { label: "UNKNOWN", value: "unknown" },
];

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  setFilters: (filters: Record<string, any>) => void;
  setSearch: (search: string) => void;
  search: any
}

export function DataTableToolbar<TData>({
  table,
  setFilters,
  setSearch,
  search
}: DataTableToolbarProps<TData>) {
  const { user, system, parentSystem } = useContact();
  const { refreshId } = useComponent();
  const [precincts, setPrecincts] = useState([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [filterOptions, setFilterOptions] = useState([]);
  const isFiltered = table.getState().columnFilters.length > 0 || search;
  const selectedRows = table.getSelectedRowModel().flatRows?.map(
    (contact) => ({ ...contact.original })
  ) || [];
  const isSelected = Object.keys(selectedRows).length > 0;



  useEffect(() => {
    if ((parentSystem && parentSystem.parent)) {
      let parId = parentSystem?.parent?._id ? parentSystem?.parent?._id : parentSystem?.parent;
      axios.get(`/api/contacts/filters?parNum=${parId}&userId=${parentSystem?._id}`).then((res) => {
        if (res.data) {
          // setFilters(res.data);
          console.log(res.data, "RES FILTER")
          setFilterOptions(res.data)
        }
      });
    }
  }, [parentSystem, setFilters, refreshId]);

  // useEffect(() => {
  //   if (selectedMunicipality) {
  //     axios.get(`/api/location/barangays/${selectedMunicipality}`).then((res) => {
  //       setBarangays(res.data.data);
  //     });
  //   }
  // }, [selectedMunicipality]);



  let barangayOptions = filterOptions?.brgyCode || [];
  let tagsOptions = tagsLabel || [];

  let precinctsOption = []

  const selectedValues = table.getColumn("brgyCode")?.getFilterValue() as any[];

  if (selectedValues) {
    selectedValues?.forEach(a => {
      let barangay = barangayOptions.find(ab => ab.value == a);
      if (barangay?.precincts) {
        barangay?.precincts.forEach(ab => {
          precinctsOption.push(ab)
        })
      }

      return barangay?.precincts
    })
  }

  tagsOptions = tagsLabel.map(a => {
    let tag = filterOptions?.tags?.find(ab => ab.value == a.value);
    if (tag) {
      return tag
    } else {
      return a
    }
  })


  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter contact..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {table.getColumn("brgyCode") && (
          <DataTableFacetedFilter
            column={table.getColumn("brgyCode")}
            title="Barangay"
            options={barangayOptions}
            onFilterChange={(values) => {
              setFilters((old) => { return { ...old, brgyCode: values } })
              // table.getColumn("tag")?.setFilterValue(values.length ? values : undefined)
            }}
          />
        )}


        {(selectedValues && table.getColumn("precinct")) && (
          <DataTableFacetedFilter
            column={table.getColumn("precinct")}
            title="Precincts"
            options={precinctsOption}
            onFilterChange={(values) => {
              setFilters((old) => { return { ...old, precincts: values } })
              // table.getColumn("tag")?.setFilterValue(values.length ? values : undefined)
            }}
          />
        )}

        {table.getColumn("tag") && (
          <DataTableFacetedFilter
            column={table.getColumn("tag")}
            title="Label"
            options={tagsOptions}
            onFilterChange={(values) => {
              setFilters((old) => { return { ...old, tags: values } })
              // table.getColumn("tag")?.setFilterValue(values.length ? values : undefined)
            }}
          />
        )}

        {isFiltered && (
          <Button variant="ghost" onClick={() => {
            setSearch("")
            table.resetColumnFilters()
            table.toggleAllPageRowsSelected(false)
            setFilters({})
          }} className="h-8 px-2 lg:px-3">
            Reset <X />
          </Button>
        )}
      </div>

      <div className="flex">

        {isSelected ? (
          <div className="mr-3">
            <DataTableToolbarActions rows={selectedRows} table={table} />
          </div>
        ) : (
          <>
            <RefreshButton />
            {user?.userType === "admin" && <UploadContactForm />}
            <DataTableViewOptions table={table} />
          </>
        )}
      </div>
    </div>
  );
}
