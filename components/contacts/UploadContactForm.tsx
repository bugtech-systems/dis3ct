"use client";

import * as React from "react";
import { BookPlusIcon, ImportIcon, UploadIcon } from "lucide-react";
import axios from "axios";
import * as XLSX from "xlsx";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { TContact } from "@/utils/types";
import { Contact } from "@/app/(app)/contacts/data/schema"
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DropdownMenuSeparator } from "../ui/dropdown-menu";
import { createBulkContact } from "@/actions/Contacts";
import { json } from "stream/consumers";
import { useContact } from "../providers/ContactProvider";

function hasKeyWithKeywords(obj: any, keywords = ["name", "phone", "address"]) {
  return Object.keys(obj).some(key =>
    keywords.some(keyword => key.toLowerCase().includes(keyword))
  );
}

export function UploadContactForm() {
  const router = useRouter(); // ⬅ Initialize useRouter
  const { user, system } = useContact();
  // State for form fields
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [jsonData, setJsonData] = React.useState<any>([]);
  // State for dynamic location selections
  const [regions, setRegions] = React.useState([]);
  const [provinces, setProvinces] = React.useState([]);
  const [municipalities, setMunicipalities] = React.useState([]);
  const [barangays, setBarangays] = React.useState([]);

  const [selectedRegion, setSelectedRegion] = React.useState("");
  const [selectedProvince, setSelectedProvince] = React.useState("");
  const [selectedMunicipality, setSelectedMunicipality] = React.useState("");
  const [selectedBarangay, setSelectedBarangay] = React.useState("");

  // Fetch Regions on Component Mount
  React.useEffect(() => {
    axios.get("/api/location/regions").then((res) => {
      setRegions(res.data.data);
    });
  }, []);

  // Fetch Provinces when Region changes
  React.useEffect(() => {
    if (selectedRegion) {
      axios.get(`/api/location/provinces/${selectedRegion}`).then((res) => {
        setProvinces(res.data.data);
        setMunicipalities([]);
        setBarangays([]);
      });
    }
  }, [selectedRegion]);

  // Fetch Municipalities when Province changes
  React.useEffect(() => {
    if (selectedProvince) {
      axios.get(`/api/location/municipalities/${selectedProvince}`).then((res) => {
        setMunicipalities(res.data.data);
        setBarangays([]);
      });
    }
  }, [selectedProvince, selectedRegion]);

  // Fetch Barangays when Municipality changes
  React.useEffect(() => {
    if (selectedMunicipality) {
      axios.get(`/api/location/barangays/${selectedMunicipality}`).then((res) => {
        setBarangays(res.data.data);
      });
    }
  }, [selectedMunicipality, selectedProvince, selectedRegion]);




  function saveData() {
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        if (data) {
          const workbook = XLSX.read(data, { type: "binary" });
          // SheetName
          const sheetName = workbook.SheetNames[0];
          // Worksheet
          const workSheet = workbook.Sheets[sheetName];
          // Json
          const json: any[] = XLSX.utils.sheet_to_json(workSheet);
          //Save to the DB
          try {
            // console.log(json);
            let newJson = [] as any;

            json.forEach(row => {
              newJson.push({ ...row, refNum: user?._id, parNum: system?.id, regCode: selectedRegion, provCode: selectedProvince, citymunCode: selectedMunicipality, brgyCode: selectedBarangay })
            })

            console.log(newJson, 'NEW JSON')
            await createBulkContact(newJson);
            setLoading(false);
            setOpen(false)
          } catch (error) {
            console.log(error);
          }
        }
      };
      reader.readAsBinaryString(file);
    }
  }

  function previewData(file: any) {
    if (file) {
      setJsonData([])
      setFile(file)
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (data) {
          const workbook = XLSX.read(data, { type: "binary" });
          // SheetName
          const sheetName = workbook.SheetNames[0];
          // Worksheet
          const workSheet = workbook.Sheets[sheetName];
          // Json
          const json: any[] = XLSX.utils.sheet_to_json(workSheet);

          let checkCol = hasKeyWithKeywords(json[0]);
          if (!checkCol) {
            return toast.error('Column Header Should be Name, Phone, Address')
          }
          setJsonData(json);
        }
      };
      reader.readAsBinaryString(file);
    }
  }


  console.log(jsonData, user, system, 'JSON DT')

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="mr-3 ml-auto hidden h-8 lg:flex"
        onClick={() => setOpen(true)}
      >
        <ImportIcon />
        Import
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
            <DialogDescription>Import contact details.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="flex justify-center">
              <TabsTrigger value="basic">File</TabsTrigger>
              <TabsTrigger value="area">Area Location</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="min-h-[300px] space-y-4 py-2 pb-4">
                <div className="space-y-2 pb-4">
                  <Label htmlFor="contact">File</Label>
                  <Input id="contact" type="file"
                    accept=".xls,.xlsx"
                    onChange={(e) => previewData(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
                <DropdownMenuSeparator />
                <Table >
                  <div className="w-full max-h-[300px] overflow-y-scroll">
                    <TableCaption>A sample of your excel content.</TableCaption>
                    <TableHeader>
                      <TableRow className="text-center ">
                        <TableHead className="text-center border-2 min-w-[150px]">Name</TableHead>
                        <TableHead className="text-center border-2 min-w-[100px]">Phone</TableHead>
                        <TableHead className="text-center border-2 w-full">Address</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody >
                      {jsonData.map((invoice: any, index: any) => (
                        <TableRow key={index} className="w-full">
                          <TableCell className="font-medium border-2">{invoice.name ?? invoice.Name}</TableCell>
                          <TableCell className="border-2">{invoice.phone ?? invoice.Phone}</TableCell>
                          <TableCell className="border-2">{invoice.address ?? invoice.Address}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </div>

                </Table>
              </div>
            </TabsContent>
            <TabsContent value="area" className="space-y-4">
              <div className="min-h-[300px] space-y-4 py-2 pb-4">
                {/* Region Selection */}
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select onValueChange={setSelectedRegion} value={selectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region: any) => (
                        <SelectItem key={region.regCode} value={region.regCode}>
                          {region.regDesc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Province Selection */}
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Select onValueChange={setSelectedProvince} value={selectedProvince} disabled={!selectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province: any) => (
                        <SelectItem key={province.provCode} value={province.provCode}>
                          {province.provDesc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Municipality Selection */}
                <div className="space-y-2">
                  <Label>City/Municipality</Label>
                  <Select onValueChange={setSelectedMunicipality} value={selectedMunicipality} disabled={!selectedProvince}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Municipality" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((mun: any) => (
                        <SelectItem key={mun.citymunCode} value={mun.citymunCode}>
                          {mun.citymunDesc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Barangay Selection */}
                <div className="space-y-2">
                  <Label>Barangay</Label>
                  <Select onValueChange={setSelectedBarangay} value={selectedBarangay} disabled={!selectedMunicipality}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Barangay" />
                    </SelectTrigger>
                    <SelectContent>
                      {barangays.map((brgy: any) => (
                        <SelectItem key={brgy.brgyCode} value={brgy.brgyCode}>
                          {brgy.brgyDesc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={loading} onClick={() => saveData()}>Save</Button>
          </DialogFooter>

        </DialogContent>
      </Dialog >

    </>
  );
}
