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
import { TContact } from "@/utils/types";
import { Contact } from "@/app/(app)/contacts/data/schema"
import { useRouter } from "next/navigation"; // ⬅ Import useRouter


export function EditContactForm({ contact, open, setOpen }: {
  contact: Contact;
  open: boolean;
  setOpen: (value: boolean) => void
}) {
  const router = useRouter(); // ⬅ Initialize useRouter
  // State for form fields
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");

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


  React.useEffect(() => {
    if (contact) {
      setPhone(contact.phone)
      setName(contact.name || "")
      setAddress(contact.address || "")
      setSelectedRegion(contact.regCode || "")
      setSelectedProvince(contact.provCode || "")
      setSelectedMunicipality(contact.citymunCode || "")
      setSelectedBarangay(contact.brgyCode || "")



    }

  }, [contact])

  // 📌 Handle Form Submission
  const handleSubmit = async () => {
    // e.preventDefault();

    // Validation
    if (!phone) {
      // toast({ title: "Error", description: "All fields are required!", status: "error" });
      // alert('Phone field is required!')
      // console.log('Phone field is required!')
      toast.error("Phone field is required!");

      return;
    }

    try {
      const response = await axios.post("/api/contacts/save", {
        phone,
        name,
        address,
        regCode: selectedRegion,
        provCode: selectedProvince,
        citymunCode: selectedMunicipality,
        brgyCode: selectedBarangay,
      });

      // toast({ title: "Success", description: response.data.message, status: "success" });
      setOpen(false); // Close modal after success
      toast.success(response.data.message);
      router.refresh();

    } catch (error: any) {
      console.log(error, 'ERROR')
      // toast({ title: "Error", description: error.response?.data?.error || "Failed to save contact.", status: "error" });
      // alert('Failed to save contact.')
      toast.error(error.response?.data?.error || "Failed to save contact.");


    }
  };



  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Edit contact details.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="flex justify-center">
              <TabsTrigger value="basic">Basic Details</TabsTrigger>
              <TabsTrigger value="area">Area Location</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="min-h-[300px] space-y-4 py-2 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" placeholder="09123123123" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Name</Label>
                  <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="Real St. Tacloban City" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
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
            <Button onClick={() => handleSubmit()}>Save</Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

    </>
  );
}
