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
import { Contact } from "@/app/(app)/contacts/data/schema"
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { findFeature, sanitizePhoneNumber } from "@/lib/helpers";
import { useContact } from "../providers/ContactProvider";
import { Switch } from "@/components/ui/switch"


export function CreateLeaderFormDialog({ contact, open, setOpen, type = 'leader' }: {
  contact?: any;
  open?: boolean;
  setOpen: (value: boolean) => void;
  type: any;
}) {
  const router = useRouter(); // ⬅ Initialize useRouter
  const { user, system } = useContact();
  // State for form fields
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [accessLevel, setAccessLevel] = React.useState("brgyCode");
  const [userType, setUserType] = React.useState("leader");
  const [accessCode, setAccessCode] = React.useState(null);
  const [port, setPort] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [features, setFeatures] = React.useState([]);

  // State for dynamic location selections
  const [municipalities, setMunicipalities] = React.useState([]);
  const [barangays, setBarangays] = React.useState([]);

  const [selectedMunicipality, setSelectedMunicipality] = React.useState("");
  const [selectedBarangay, setSelectedBarangay] = React.useState("");



  const handleLocation = async (data) => {
    if (data) {
      let response = await axios.get(`/api/location/access?code=${data?.accessCode}&level=${data?.accessLevel}`);
      if (response?.data) {
        let { regCode, provCode, citymunCode, brgyCode } = response.data;
        setAccessCode(data.accessCode)
        setAccessLevel(data.accessLevel)
        setSelectedMunicipality(citymunCode)
        setSelectedBarangay(brgyCode)
      }
    }
  }


  const handleFeatues = (type) => {
    let config = findFeature(features, type);
    let newConfs = features;


    if (config.title == type) {
      newConfs = features.filter(conf => conf.title != type);

      newConfs.push({
        title: type,
        value: !config.value
      })
    } else {
      newConfs.push({
        title: type,
        value: true
      });
    }

    setFeatures(newConfs)
  }


  // Fetch Regions on Component Mount
  React.useEffect(() => {
    if (user && open) {
      handleLocation(system ? system : user)

    }

  }, [user, open]);


  const handleAccessLevel = (e) => prop => {

    if (accessLevel == 'citymunCode' && e == 'city') {
      setAccessCode(prop)
    } else if (accessLevel == 'brgyCode' && e == 'brgy') {
      setAccessCode(prop)
    }


    if (e == 'city') {
      setSelectedMunicipality(prop)
    } else if (e == 'brgy') {
      setSelectedBarangay(prop)
    }
  }

  React.useEffect(() => {
    if (selectedMunicipality) {
      axios.get(`/api/location/barangays/${selectedMunicipality}`).then((res) => {
        setBarangays(res.data.data);
      });
    }
  }, [selectedMunicipality, accessLevel]);

  // // Fetch Barangays when Municipality changes
  React.useEffect(() => {
    // if (selectedProvince) {

    axios.get(`/api/location/municipalities`).then((res) => {
      setMunicipalities(res.data.data);
      let citymun = res.data.data.find(city => city.citymunCode == selectedMunicipality)
      if (citymun) {
        setMunicipalities([citymun]);
      }
      // setBarangays([]);
      // setSelectedMunicipality(null)
      // setSelectedBarangay(null)
    });
  }, [accessLevel, selectedMunicipality]);



  React.useEffect(() => {
    if (contact) {
      setName(contact?.name || "");
      setPhone(contact?.phone || "");
      setAccessCode(contact.accessCode || "");
      setAccessLevel("brgyCode")
      setUserType(contact.userType || "leader")
      setFeatures(system?.configs || [])

    }

  }, [contact, open])





  // 📌 Handle Form Submission
  const handleSubmit = async () => {
    // e.preventDefault();

    // Validation
    if (!phone || !name || !username || !password) {
      // toast({ title: "Error", description: "All fields are required!", status: "error" });
      // alert('Phone field is required!')
      // console.log('Phone field is required!')
      toast.error("Phone or Name field is required!");

      return;
    }

    try {
      await axios.post("/api/users", {
        action: "register",
        userId: contact?.id,
        phone: sanitizePhoneNumber(phone),
        name,
        username,
        accessCode,
        accessLevel,
        userType,
        password,
        refNum: user._id,
        parent: user.userType == 'system' ? user._id : system.parent,
        configs: features,
        accessCodes: [selectedBarangay],
        port
      }).then((resp) => {
        return;
      });

      setPhone("")
      setName("")
      setSelectedMunicipality("")
      setSelectedBarangay(null)
      // setSystem(null);
      setMunicipalities([])
      setBarangays([])
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
            <DialogTitle>{contact?.id ? 'Edit' : 'Create'} {type == 'leader' ? 'Leader' : 'System'}</DialogTitle>
            <DialogDescription>
              Add a new {type == 'leader' ? 'Leader' : 'System'}.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="flex justify-center">
              <TabsTrigger value="basic">System Details</TabsTrigger>
              {/* <TabsTrigger value="area">Area</TabsTrigger> */}
              <TabsTrigger value="access" >
                Access
              </TabsTrigger>
              {user?.userType == 'admin' &&
                <TabsTrigger value="features">Features</TabsTrigger>
              }
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="min-h-[300px] space-y-4 py-2 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" placeholder="09123123123" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Leader Name</Label>
                  <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userLevel">Access Level</Label>
                  <Select onValueChange={setAccessLevel} value={accessLevel} >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brgyCode">
                        <span className="font-medium">Barangay</span> -{" "}
                        <span className="text-muted-foreground">
                          Barangay Level
                        </span>
                      </SelectItem>
                      <SelectItem value="citymunCode">
                        <span className="font-medium">City/Municipality</span> -{" "}
                        <span className="text-muted-foreground">
                          City or Municipality Level
                        </span>
                      </SelectItem>
                      {/*   <SelectItem value="provCode">
                        <span className="font-medium">Province</span> -{" "}
                        <span className="text-muted-foreground">
                          Provincial Level
                        </span>
                      </SelectItem>
                      <SelectItem value="regCode">
                        <span className="font-medium">Region</span> -{" "}
                        <span className="text-muted-foreground">
                          Regional Level
                        </span>
                      </SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City/Municipality</Label>
                  <Select
                    // onValueChange={handleAccessLevel('city')} 
                    value={selectedMunicipality} disabled={true}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Municipality" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((mun: any) => (
                        <SelectItem key={mun.citymunCode} value={mun.citymunCode}>
                          {mun.citymunDesc}{mun.provDesc ? ` - ${mun.provDesc}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Barangay Selection */}
                <div className="space-y-2">
                  <Label>Barangay</Label>
                  <Select onValueChange={handleAccessLevel('brgy')} value={selectedBarangay} disabled={!accessLevel}>
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
            <TabsContent value="area" className="space-y-4">
              <div className="min-h-[300px] space-y-4 py-2 pb-4">
                {/* Region Selection */}
                {/*            <div className="space-y-2">
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
                </div> */}

                {/* Province Selection */}
                {/* <div className="space-y-2">
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
                </div> */}

                {/* Municipality Selection */}
                {/* <div className="space-y-2">
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
                </div> */}

                {/* Barangay Selection */}
                {/* <div className="space-y-2">
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
                </div> */}
              </div>
            </TabsContent>
            <TabsContent value="access" className="space-y-4">
              <div className="min-h-[300px]">
                <div className="space-y-4 py-2 pb-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin">Password</Label>
                    <Input id="pin" placeholder="000000" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  {/*  <div className="space-y-2">
                    <Label htmlFor="subscription">User Type</Label>
                    <Select onValueChange={setUserType} value={userType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leader">
                          <span className="font-medium">Leader</span> -{" "}
                          <span className="text-muted-foreground">
                            Team Leader
                          </span>
                        </SelectItem>
                        <SelectItem value="system">
                          <span className="font-medium">System</span> -{" "}
                          <span className="text-muted-foreground">
                            Parent System
                          </span>
                        </SelectItem>
                        <SelectItem value="admin">
                          <span className="font-medium">Pro</span> -{" "}
                          <span className="text-muted-foreground">
                            System Admin
                          </span>
                        </SelectItem>

                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Port</Label>
                    <Input id="port" placeholder="COM PORT" value={port || ""} onChange={(e) => setPort(e.target.value)} />
                  </div> */}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="features" className="space-y-4">
              <div className="min-h-[300px]">

                <div className="space-y-5">
                  <h3 className="mb-4 text-lg font-medium  justify-between items-start">Allow Features</h3>
                  <div className="flex space-x-5">
                    <div className="space-y-0.5 flex flex-col flex-1">
                      <Label className="text-base" htmlFor="username">Create Leaders</Label>
                      {/* <FormDescription> */}
                      <span className="text-sm text-foreground">
                        Allow creating new leader account
                      </span>
                      {/* </FormDescription> */}
                    </div>
                    <Switch

                      checked={findFeature(features, 'leaders')?.value}
                      onCheckedChange={e => handleFeatues('leaders')}
                    />
                  </div>
                  <div className="flex space-x-5">
                    <div className="space-y-0.5 flex flex-col flex-1">
                      <Label className="text-base" htmlFor="username">Biometric Device</Label>
                      {/* <FormDescription> */}
                      <span className="text-sm text-foreground">
                        Allow using biometric scanners
                      </span>
                      {/* </FormDescription> */}
                    </div>
                    <Switch
                      checked={findFeature(features, 'biometric')?.value}
                      onCheckedChange={e => handleFeatues('biometric')}
                    />
                  </div>
                  <div className="flex space-x-5">
                    <div className="space-y-0.5 flex flex-col flex-1">
                      <Label className="text-base" htmlFor="username">GSM Module</Label>
                      {/* <FormDescription> */}
                      <span className="text-sm text-foreground">
                        Allow system to interact with sms
                      </span>
                      {/* </FormDescription> */}
                    </div>
                    <Switch
                      checked={findFeature(features, 'sms')?.value}
                      onCheckedChange={e => handleFeatues('sms')}
                    />
                  </div>
                  <div className="flex space-x-5">
                    <div className="space-y-0.5 flex flex-col flex-1">
                      <Label className="text-base" htmlFor="username">Ask AI</Label>
                      {/* <FormDescription> */}
                      <span className="text-sm text-foreground">
                        Allow using AI Features
                      </span>
                      {/* </FormDescription> */}
                    </div>
                    <Switch
                      checked={findFeature(features, 'ai')?.value}
                      onCheckedChange={e => handleFeatues('ai')}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSubmit()}>Save</Button>
          </DialogFooter>

        </DialogContent >
      </Dialog >

    </>
  );
}
