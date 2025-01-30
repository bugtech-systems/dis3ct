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
import { Contact } from "@/data/schema"
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { sanitizePhoneNumber } from "@/lib/helpers";


export function CreateSystemForm({ user, contact, open, setOpen }: {
  user?: Contact;
  contact?: Contact;
  open: boolean;
  setOpen: (value: boolean) => void
}) {
  const router = useRouter(); // ⬅ Initialize useRouter
  // State for form fields
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [userLevel, setUserLevel] = React.useState("normal");
  const [subscription, setSubscription] = React.useState("basic");

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
  }, [selectedMunicipality, selectedProvince]);




  // 📌 Handle Form Submission
  const handleSubmit = async () => {
    // e.preventDefault();

    // Validation
    if (!phone && !name) {
      // toast({ title: "Error", description: "All fields are required!", status: "error" });
      // alert('Phone field is required!')
      // console.log('Phone field is required!')
      toast.error("Phone or Name field is required!");

      return;
    }

    try {
      const response = await axios.post("/api/contacts/save/leader", {
        phone: sanitizePhoneNumber(phone),
        name,
        regCode: selectedRegion,
        provCode: selectedProvince,
        citymunCode: selectedMunicipality,
        brgyCode: selectedBarangay,
        userLevel: 'system',
        subscription: subscription
      });

      // toast({ title: "Success", description: response.data.message, status: "success" });
      setOpen(false); // Close modal after success
      toast.success('System created Successfully');
      router.refresh();
    } catch (error: any) {
      console.log(error, 'ERROR')
      // toast({ title: "Error", description: error.response?.data?.error || "Failed to save contact.", status: "error" });
      // alert('Failed to save contact.')
      toast.error(error.response?.data?.error || "Failed to save System.");


    }
  };



  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create System</DialogTitle>
            <DialogDescription>
              Add a new system.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="flex justify-center">
              <TabsTrigger value="basic">System Details</TabsTrigger>
              <TabsTrigger value="area">Area Location</TabsTrigger>
              {/* <TabsTrigger value="access" >
                                Access Level
                              </TabsTrigger> */}
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="min-h-[300px] space-y-4 py-2 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" placeholder="09123123123" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">System Name</Label>
                  <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription">Subscription plan</Label>
                  <Select onValueChange={setSubscription} value={subscription}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">
                        <span className="font-medium">Basic</span> -{" "}
                        <span className="text-muted-foreground">
                          Unlimited Sms
                        </span>
                      </SelectItem>
                      <SelectItem value="pro">
                        <span className="font-medium">Pro</span> -{" "}
                        <span className="text-muted-foreground">
                          Unlimited Sms and Flash Sms
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
            <TabsContent value="access" className="space-y-4">
              <div className="min-h-[300px]">
                <div className="space-y-4 py-2 pb-4">
                  <div className="space-y-2">
                    <Label htmlFor="subscription">Subscription plan</Label>
                    <Select onValueChange={setSubscription} value={subscription}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">
                          <span className="font-medium">Basic</span> -{" "}
                          <span className="text-muted-foreground">
                            Unlimited Sms
                          </span>
                        </SelectItem>
                        <SelectItem value="pro">
                          <span className="font-medium">Pro</span> -{" "}
                          <span className="text-muted-foreground">
                            Unlimited Sms and Flash Sms
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userLevel">Access Level</Label>
                    <Select onValueChange={setUserLevel} value={userLevel} >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="barangay">
                          <span className="font-medium">Barangay</span> -{" "}
                          <span className="text-muted-foreground">
                            Barangay Level
                          </span>
                        </SelectItem>
                        <SelectItem value="municipal">
                          <span className="font-medium">City/Municipality</span> -{" "}
                          <span className="text-muted-foreground">
                            City or Municipality Level
                          </span>
                        </SelectItem>
                        <SelectItem value="provincial">
                          <span className="font-medium">Province</span> -{" "}
                          <span className="text-muted-foreground">
                            Provincial Level
                          </span>
                        </SelectItem>
                        <SelectItem value="regional">
                          <span className="font-medium">Region</span> -{" "}
                          <span className="text-muted-foreground">
                            Regional Level
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
