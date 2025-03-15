"use client";

import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,

} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { SidebarOptInForm } from "../sidebar-opt-in-form";
import { useComponent } from "../providers/ComponentContext";
import { Input } from "../ui/input";
import { findFeature, findObject, updateOrPushObject } from "@/lib/helpers";
import { Label } from "../ui/label";
import axios from "axios";

export function SetHotlineForm() {
  const { modal, setModal, record } = useComponent();
  const [mobile, setMobile] = React.useState("");
  const [designation, setDesignation] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState("")



  // 📌 Handle Form Submission
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Validation
    if (!mobile) {
      // toast({ title: "Error", description: "All fields are required!", status: "error" });
      // alert('Phone field is required!')
      // console.log('Phone field is required!')
      toast.error("Phone field is required!");

      return;
    }

    try {

      let newTags = updateOrPushObject(record.tags, { tagType: 'hotline', value: mobile, note: description, title: designation });
      console.log(newTags, 'NEW TAGS', record.tags)
      const response = await axios.post(`/api/contacts/save/${record._id}`, {
        phone: mobile,
        tags: newTags,
        recordType: 'hotline'
      });

      // toast({ title: "Success", description: response.data.message, status: "success" });
      setModal(null); // Close modal after success
      toast.success(response.data.message);

    } catch (error: any) {
      console.log(error, 'ERROR')
      // toast({ title: "Error", description: error.response?.data?.error || "Failed to save contact.", status: "error" });
      // alert('Failed to save contact.')
      toast.error(error.response?.data?.error || "Failed to save contact.");


    }
  };

  React.useEffect(() => {
    if (record) {
      let hotlineTag = findObject(record.tags, 'hotline', 'tagType');
      console.log(hotlineTag, 'HOTLINE TAG', record)
      setMobile(record.phone || hotlineTag?.value)
      setDesignation(hotlineTag?.title)
      setDescription(hotlineTag?.note)

    }


  }, [record])


  return (
    <>
      <Dialog open={modal == 'setHotline'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-sm">Set Hotline Profile</CardTitle>
              <CardDescription>New Hotline Profile.</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-2.5 p-4">
              {record &&
                <div>
                  Set Hotline As: <br /> {record.name}
                </div>
              }
              <Input
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
              <div className="space-y-2">
                <Label htmlFor="name">Designation</Label>
                <Input id="name" placeholder="Firefighter" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Accident, Injury, Emergency" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <br />
              <Button
                type="submit"
                className="w-full bg-sidebar-primary text-sidebar-primary-foreground shadow-none"
                size="sm"
              // disabled={loading}
              >
                Set Hotline
              </Button>
            </CardContent>
          </form>
        </DialogContent>
      </Dialog >
    </>
  );
}
