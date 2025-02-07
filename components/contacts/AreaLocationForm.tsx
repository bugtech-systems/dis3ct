"use client";

import * as React from "react";
import { BookPlusIcon } from "lucide-react";
import axios from "axios";

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
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { useContact } from "../providers/ContactProvider";

export function AreaLocationForm({ setShowContactDialog, showContactDialog, selectedContacts = [] }: { setShowContactDialog: any, showContactDialog: any; selectedContacts: any; }) {
  const { user, system } = useContact();

  const router = useRouter(); // ⬅ Initialize useRouter

  // State for form fields
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");

  // State for dynamic location selections
  const [regions, setRegions] = React.useState<any>([]);
  const [provinces, setProvinces] = React.useState<any>([]);
  const [municipalities, setMunicipalities] = React.useState<any>([]);
  const [barangays, setBarangays] = React.useState<any>([]);

  const [selectedRegion, setSelectedRegion] = React.useState<any>(null);
  const [selectedProvince, setSelectedProvince] = React.useState<any>(null);
  const [selectedMunicipality, setSelectedMunicipality] = React.useState<any>(null);
  const [selectedBarangay, setSelectedBarangay] = React.useState<any>(null);

  // Fetch Regions on Component Mount
  React.useEffect(() => {
    axios.get("/api/location/regions").then((res) => {
      setRegions(res.data.data);
    });


  }, []);

  // Fetch Provinces when Region changes
  React.useEffect(() => {
    if (selectedRegion) {
      axios.get(`/api/location/provinces/${selectedRegion.regCode}`).then((res) => {
        setProvinces(res.data.data);
        setMunicipalities([]);
        setBarangays([]);
      });
    }
  }, [selectedRegion]);

  // Fetch Municipalities when Province changes
  React.useEffect(() => {
    if (selectedProvince) {
      axios.get(`/api/location/municipalities/${selectedProvince.provCode}`).then((res) => {
        setMunicipalities(res.data.data);
        setBarangays([]);
      });
    }
  }, [selectedProvince]);

  // Fetch Barangays when Municipality changes
  React.useEffect(() => {
    if (selectedMunicipality) {
      axios.get(`/api/location/barangays/${selectedMunicipality.citymunCode}`).then((res) => {
        setBarangays(res.data.data);
      });
    }
  }, [selectedMunicipality]);

  // 📌 Handle Form Submission
  const handleSubmit = async () => {
    // e.preventDefault();

    // Validation
    if (!selectedContacts.length) {
      // toast({ title: "Error", description: "All fields are required!", status: "error" });
      // alert('Phone field is required!')
      // console.log('Phone field is required!')
      toast.error("Contacts is required!");

      return;
    }

    try {





      const response = await axios.post("/api/contacts/bulk/area", {
        rows: selectedContacts,
        regCode: selectedRegion?.regCode,
        provCode: selectedProvince?.provCode,
        citymunCode: selectedMunicipality?.citymunCode,
        brgyCode: selectedBarangay?.brgyCode,
      });
      setShowContactDialog(false); // Close modal after success
      toast.success(response.data);
      router.refresh();

    } catch (error: any) {
      console.log(error, 'ERROR')
      toast.error(error.response?.data?.error || "Failed to save contact.");
    }
  };



  return (
    <>
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Area Location</DialogTitle>
            <DialogDescription>Add area location to the group.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="flex justify-center">
              <TabsTrigger value="area">Area Location</TabsTrigger>
            </TabsList>

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
                      {regions.map((region: any, index: any) => {
                        return (
                          <SelectItem key={`${index}-reg`} value={region}>
                            {region?.regDesc}
                          </SelectItem>
                        )
                      }
                      )}
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
                      {provinces.map((province: any, index: any) => (
                        <SelectItem key={`${index}-prov`} value={province}>
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
                      {municipalities.map((mun: any, index: any) => (
                        <SelectItem key={index} value={mun}>
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
                      {barangays.map((brgy: any, index: any) => (
                        <SelectItem key={index} value={brgy}>
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
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
            <Button onClick={() => handleSubmit()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
