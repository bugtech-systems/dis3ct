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
import WebcamSelector from "../webcam-selector";
import { useComponent } from "../providers/ComponentContext";

export function ViewContactForm({ contact, open, setOpen }: { contact: any; open: any; setOpen: any }) {
  // const { user, system } = useContact();



  // State for form fields






  return (
    <>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Record</DialogTitle>
            <DialogDescription>View record details</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="flex justify-center">
              <TabsTrigger value="basic">Basic Details</TabsTrigger>
              <TabsTrigger value="area">Area Location</TabsTrigger>
              {/* <TabsTrigger value="image">Image</TabsTrigger> */}
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="min-h-[300px] space-y-4 py-2 pb-4">

                <div className="space-y-2">
                  <Label htmlFor="name">Contact Name</Label>
                  <Input id="name" placeholder="John Doe" value={contact?.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input id="mobile" placeholder="09123123123" value={contact?.phone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="Real St. Tacloban City" value={contact?.address} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Marker</Label>
                  <Input id="address" placeholder="" value={contact?.marker} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Precinct</Label>
                  <Input id="address" placeholder="Real St. Tacloban City" value={contact?.precinct} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="area" className="space-y-4">
              <div className="min-h-[300px] space-y-4 py-2 pb-4">
                {/* Region Selection */}
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input id="address" placeholder="Region VIII" value={contact?.region} />
                </div>

                {/* Province Selection */}
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Input id="address" placeholder="Leyte" value={contact?.province} />
                </div>

                {/* Municipality Selection */}
                <div className="space-y-2">
                  <Label>City/Municipality</Label>
                  <Input id="address" placeholder="Tacloban City" value={contact?.citymun} />
                </div>

                {/* Barangay Selection */}
                <div className="space-y-2">
                  <Label>Barangay</Label>
                  <Input id="address" placeholder="Barangay 56" value={contact?.barangay} />
                </div>
              </div>
            </TabsContent>
            {/*  <TabsContent value="image" className="space-y-4">
              <div className="min-h-[300px] space-y-4 py-2 pb-4">
                <WebcamSelector />
              </div>
            </TabsContent> */}
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            {/* <Button onClick={() => handleSubmit()}>Save</Button> */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
