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
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { findFeature, sanitizePhoneNumber } from "@/lib/helpers";
import { useContact } from "../providers/ContactProvider";
import { Switch } from "@/components/ui/switch"


export function LeaderProfileForm({ open, setOpen, profile }: {
  profile?: any;
  open?: boolean;
  setOpen: (value: boolean) => void
}) {
  const router = useRouter(); // ⬅ Initialize useRouter
  const { user } = useContact()
  // State for form fields
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [accessLevel, setAccessLevel] = React.useState("brgyCode");
  const [userType, setUserType] = React.useState("system");
  const [accessCode, setAccessCode] = React.useState(null);
  const [accessCodes, setAccessCodes] = React.useState<any>([]);
  const [port, setPort] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [features, setFeatures] = React.useState([]);
  const [host, setHost] = React.useState('');
  // State for dynamic location selections
  const [municipalities, setMunicipalities] = React.useState([]);
  const [barangays, setBarangays] = React.useState([]);

  const [selectedRegion, setSelectedRegion] = React.useState("");
  const [selectedProvince, setSelectedProvince] = React.useState("");
  const [selectedMunicipality, setSelectedMunicipality] = React.useState("");
  const [selectedBarangay, setSelectedBarangay] = React.useState("");



  const handleAccessTypes = (e) => {

    setAccessLevel(e)
    if (e == 'citymunCode') {
      setAccessCodes(barangays.map(a => a.brgyCode))

    } else {
      setAccessCodes([selectedBarangay])
    }
  }


  // Fetch Regions on Component Mount

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

  const handleAccessLevel = (e) => prop => {




    if (e == 'city') {
      setSelectedMunicipality(prop)
      setAccessCode(prop)

    } else if (e == 'brgy') {
      setSelectedBarangay(prop)

      let code = barangays.find(cd => cd.brgyCode == prop);
      let barExist = accessCodes.find(cd => cd == prop);
      let newBars = [];
      if (barExist) {
        newBars = accessCodes.filter(cd => cd != prop)
      } else {
        newBars = accessCodes;
        newBars.push(prop);
      }

      setAccessCodes(newBars)
    }
  }

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


      await axios.post("/api/users", {
        action: "update",
        userId: profile?._id,
        phone: sanitizePhoneNumber(phone),
        name,
        username,
        accessCode,
        accessLevel,
        userType,
        configs: features,
        port,
        accessCodes,
        ...(password ? { password } : {}),
        host
      })

      // toast({ title: "Success", description: response.data.message, status: "success" });
      setOpen(false); // Close modal after success
      toast.success('Profile updated Successfully');
      router.refresh();
    } catch (error: any) {
      console.log(error, 'ERROR')
      // toast({ title: "Error", description: error.response?.data?.error || "Failed to save contact.", status: "error" });
      // alert('Failed to save contact.')
      toast.error(error.response?.data?.error || "Failed to save System.");


    }
  };




  // // Fetch Barangays when Municipality changes
  React.useEffect(() => {
    // if (selectedProvince) {

    axios.get(`/api/location/municipalities`).then((res) => {
      setMunicipalities(res.data.data);
      // setBarangays([]);
    });

    // }




  }, [accessLevel]);


  React.useEffect(() => {
    if (selectedMunicipality) {
      axios.get(`/api/location/barangays/${selectedMunicipality}`).then((res) => {
        setBarangays(res.data.data);
      });
    }
  }, [selectedMunicipality]);


  React.useEffect(() => {
    if (profile && open) {
      setPhone(profile.phone)
      setUsername(profile.username || "")
      setName(profile.name || "")
      setAccessCode(profile.accessCode || "");
      setSelectedMunicipality(profile.accessCode || "")
      setAccessLevel(profile.accessLevel || "brgyCode")
      setUserType(profile.userType || "leader")
      setFeatures(profile?.configs || [])
      setAccessCodes(profile.accessCodes || [])
      // handleLocation(profile)

      // axios.get(`/api/contacts/save/system/${contact.phone}`).then((res) => {
      //   setParentSystem(res.data);
      //   setSystem(res.data);
      //   setPort(res.data.port)
      // });
    }

    return () => {
      setPassword("");
      setPhone("")
      setName("")
      setFeatures([])
      setUserType("system")
      setSelectedRegion("")
      // setSelectedProvince("")
      setSelectedMunicipality("")
      setSelectedBarangay("")
      setPort("");
    }

  }, [profile, open])


  // console.log(selectedProvince, municipalities, 'PROV', system, user)
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{profile?._id ? 'Edit' : 'Create'} System</DialogTitle>
            <DialogDescription>
              Add a new system.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="flex justify-center">
              <TabsTrigger value="basic">System Details</TabsTrigger>
              {/* <TabsTrigger value="area">Area</TabsTrigger> */}
              {((user?._id == profile?._id) || user?.userType == 'admin') &&
                <TabsTrigger value="access" >
                  Access
                </TabsTrigger>
              }
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
                  <Label htmlFor="name">System Name</Label>
                  <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userLevel">Access Level</Label>
                  <Select onValueChange={handleAccessTypes} value={accessLevel} disabled={user.userType != 'admin'}>
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
                  <Select onValueChange={handleAccessLevel('city')} value={selectedMunicipality} disabled={user.userType != 'admin'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Municipality" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((mun: any) => (
                        <SelectItem key={mun.citymunCode} value={mun.citymunCode}>
                          {mun.citymunDesc} - {mun.provDesc}
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
                          {brgy.brgyDesc} - {accessCodes.find(code => code == brgy.brgyCode) ? 'Selected' : ''}
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
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin">Password</Label>
                    <Input id="pin" placeholder="000000" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  {(user?.userType == 'admin') &&
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="subscription">User Type</Label>
                        <Select onValueChange={setUserType} value={userType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                          <SelectContent>
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Host</Label>
                        <Input id="host" placeholder="Host" value={host || ""} onChange={(e) => setHost(e.target.value)} />
                      </div>
                    </>
                  }
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
                      <Label className="text-base" htmlFor="username">Image Upload</Label>
                      {/* <FormDescription> */}
                      <span className="text-sm text-foreground">
                        Allow record to have images
                      </span>
                      {/* </FormDescription> */}
                    </div>
                    <Switch
                      checked={findFeature(features, 'image')?.value}
                      onCheckedChange={e => handleFeatues('image')}
                    />
                  </div>
                  <div className="flex space-x-5">
                    <div className="space-y-0.5 flex flex-col flex-1">
                      <Label className="text-base" htmlFor="username">Image Scanner</Label>
                      {/* <FormDescription> */}
                      <span className="text-sm text-foreground">
                        Allow Face Sanning of images
                      </span>
                      {/* </FormDescription> */}
                    </div>
                    <Switch
                      checked={findFeature(features, 'face')?.value}
                      onCheckedChange={e => handleFeatues('face')}
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
            <Button onClick={() => handleSubmit()}>Update</Button>
          </DialogFooter>

        </DialogContent >
      </Dialog >

    </>
  );
}
