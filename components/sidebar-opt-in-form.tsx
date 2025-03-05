"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInput } from "@/components/ui/sidebar";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { useSession } from "next-auth/react";
import { Contact } from "@/data/schema";
import { useContact } from "./providers/ContactProvider";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { useComponent } from "./providers/ComponentContext";

export function SidebarOptInForm({ record }: { record: any }) {
  const { system } = useContact()
  const { setModal } = useComponent()
  const [mobile, setMobile] = useState("");
  const [isFlash, setIsFlash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter(); // ⬅ Initialize useRouter

  // 📌 Validate Philippine Mobile Number
  const isValidPhilippineMobile = (number: string): boolean => {
    const sanitizedNumber = number.replace(/\D/g, ""); // Remove non-numeric characters

    // Philippine mobile number should match these formats:
    return /^(9\d{9}|09\d{9}|639\d{9}|\+639\d{9})$/.test(sanitizedNumber);
  };

  // 📌 Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!mobile) {
      setError("Mobile number is required.");
      return;
    }

    if (!isValidPhilippineMobile(mobile)) {
      setError("Invalid mobile number.");
      return;
    }

    setLoading(true);

    try {


      const response = await axios.post("/api/public/contacts", { phone: mobile, recordId: record._id, system: system.phone, isFlash });

      if (response.data) {
        toast.success("Invite Sent!");
        setMobile(""); // Clear input after success
        setModal(null)
      }

    } catch (err: any) {
      console.log(err, 'ERR')
      setError(err.response?.data?.error || "Failed to send invite.");
      toast.error("Failed to send invite.");
    } finally {
      setLoading(false);
      router.refresh();
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm">Invite Someone to Subscribe</CardTitle>
        <CardDescription>Opt-in to receive updates and news about Maretext.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-2.5 p-4">
        {record &&
          <div>
            Send Invite to: <br /> {record.name}
          </div>
        }
        <SidebarInput
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex items-center">
          <Label htmlFor="flash-message" className="flex items-center gap-2 text-xs font-normal">
            <Switch id="flash-message" checked={isFlash} onCheckedChange={setIsFlash} /> Flash Message
          </Label>
        </div>
        <Button
          type="submit"
          className="w-full bg-sidebar-primary text-sidebar-primary-foreground shadow-none"
          size="sm"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Invite"}
        </Button>
      </CardContent>
    </form>
  );
}
