"use client";

import { useEffect, useState, useMemo } from "react";
import { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { DataTableViewOptions } from "@/app/(app)/tasks/components/data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableToolbarActions } from "./data-table-toolbar-actions";
import { UploadContactForm } from "@/components/contacts/UploadContactForm";

import { useContact } from "@/components/providers/ContactProvider";
import { userLevels } from "../data/data";
import { Input } from "@/components/ui/input";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  selectedRow: any;
  search: any;
  setSearch: any;
}

export function DataTableToolbar<TData>({ table, selectedRow = {}, search, setSearch }: DataTableToolbarProps<TData>) {
  const { user } = useContact();
  const [locationData, setLocationData] = useState({ regions: [], provinces: [], citymuns: [], barangays: [] });

  const isFiltered = table.getState().columnFilters.length > 0;
  const isSelected = Object.keys(selectedRow).length > 0;
  const selectedRows = table.getSelectedRowModel().flatRows.map(row => row.original);

  const selectedProvinceValues = new Set(table.getColumn("provCode")?.getFilterValue() as string[]);
  const selectedCityValues = new Set(table.getColumn("citymunCode")?.getFilterValue() as string[]);
  const selectedRegionValues = new Set(table.getColumn("regCode")?.getFilterValue() as string[]);



  // Fetch location data once on mount
  useEffect(() => {
    if (!user) return;

    const fetchLocationData = async () => {
      try {
        const [regionsRes, provincesRes, citymunsRes, barangaysRes] = await Promise.all([
          axios.get("/api/location/regions"),
          axios.get(`/api/location/provinces/${user.regCode}`),
          axios.get(`/api/location/municipalities/${user.provCode}`),
          axios.get(`/api/location/barangays/${user.citymunCode}`)
        ]);

        setLocationData({
          regions: regionsRes.data.data,
          provinces: provincesRes.data.data,
          citymuns: citymunsRes.data.data,
          barangays: barangaysRes.data.data
        });


        // Auto-set the province filter for provincial users
        if (user.userLevel === "provincial") {
          table.getColumn("citymunCode")?.setFilterValue([user.citymunCode]);
        }
        // if (user.userLevel === "provincial") {
        //   table.getColumn("provCode")?.setFilterValue([user.provCode]);
        // }

        if (user.userLevel === "municipal") {
          table.getColumn("brgyCode")?.setFilterValue([user.brgyCode]);
        }


      } catch (error) {
        console.error("Error fetching location data:", error);
      }
    };

    fetchLocationData();
  }, [user,]);

  // Get filter values

  // Memoized dropdown options
  const provincesOptions = useMemo(() => {
    return locationData.provinces
      .filter(province => !selectedRegionValues.size || selectedRegionValues.has(province.regCode))
      .map(province => ({ value: province.provCode, label: province.provDesc }));
  }, [locationData.provinces, selectedRegionValues]);

  const citymunOptions = useMemo(() => {
    return locationData.citymuns
      .filter(citymun => !selectedProvinceValues.size || selectedProvinceValues.has(citymun.provCode))
      .map(citymun => ({ value: citymun.citymunCode, label: citymun.citymunDesc }));
  }, [locationData.citymuns, selectedProvinceValues]);

  const barangayOptions = useMemo(() => {
    return locationData.barangays
      // .filter(barangay => selectedCityValues.has(barangay.citymunCode))
      .map(barangay => ({ value: barangay.brgyCode, label: barangay.brgyDesc }));
  }, [locationData.barangays, selectedCityValues]);


  console.log(user, 'USER TOOl', selectedCityValues, selectedRow, selectedRows)
  return (
    <div className="flex flex-1  justify-between items-end">
      {/* Filters */}
      <div className="flex justify-center items-center space-x-2">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {/* Regional User - Show Province, City/Municipality, Barangay Filters */}
        {user?.userLevel === "regional" && (
          <>
            {table.getColumn("provCode") && (
              <DataTableFacetedFilter column={table.getColumn("provCode")} title="Province" options={provincesOptions} />
            )}
            {table.getColumn("citymunCode") && (
              <DataTableFacetedFilter column={table.getColumn("citymunCode")} title="City/Municipality" options={citymunOptions} />
            )}
            {table.getColumn("brgyCode") && selectedCityValues.size > 0 && (
              <DataTableFacetedFilter column={table.getColumn("brgyCode")} title="Barangay" options={barangayOptions} />
            )}
          </>
        )}

        {/* Provincial User - Show City/Municipality & Barangay Filters */}
        {user?.userLevel === "provincial" && (
          <>
            {table.getColumn("citymunCode") && (
              <DataTableFacetedFilter column={table.getColumn("citymunCode")} title="City/Municipality" options={citymunOptions} />
            )}
            {table.getColumn("brgyCode") && selectedCityValues.size > 0 && (
              <DataTableFacetedFilter column={table.getColumn("brgyCode")} title="Barangay" options={barangayOptions} />
            )}
          </>
        )}

        {/* Municipal User - Show Barangay Filter Only */}
        {user?.userLevel === "municipal" && (
          table.getColumn("brgyCode") && (
            <DataTableFacetedFilter column={table.getColumn("brgyCode")} title="Barangay" options={barangayOptions} />
          )
        )}

        {/* Admin - Show User Level Filter */}
        {user?.userLevel === "admin" && table.getColumn("userLevel") && (
          <DataTableFacetedFilter column={table.getColumn("userLevel")} title="User Level" options={userLevels} />
        )}

        {/* Reset Filters Button */}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Reset
            <X className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex ">

        {/* Toolbar Actions */}
        {isSelected ? (
          <div className="mr-3">
            <DataTableToolbarActions rows={selectedRows} />
          </div>
        ) : (
          <>
            {user?.subscription == 'pro' &&
              <UploadContactForm />
            }
            <DataTableViewOptions table={table} />
          </>
        )}
      </div>

    </div >
  );
}
