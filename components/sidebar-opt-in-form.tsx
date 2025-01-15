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

export function SidebarOptInForm() {
  const { data: session } = useSession() as any; // Get the session data from next-auth
  const [user, setUser] = useState<Contact>();
  const [mobile, setMobile] = useState("");
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
      const response = await axios.post("/api/contacts/save", { phone: mobile });

      toast.success("Invite Sent!");
      setMobile(""); // Clear input after success
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send invite.");
      toast.error("Failed to send invite.");
    } finally {
      setLoading(false);
      router.refresh();
    }
  };
  
  useEffect(() => {
    // Fetch user details from API if session exists
    if (session?.user?.id) {
      axios.get(`/api/contacts/${session.user.phone}`)
        .then((response) => {
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        })
        // .finally(() => setLoading(false));
    }
  }, [session]);
  

  return (
    <Card className="shadow-none">
      <form onSubmit={handleSubmit}>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm">Invite Someone to Subscribe</CardTitle>
          <CardDescription>Opt-in to receive updates and news about Maretext.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2.5 p-4">
          <SidebarInput
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
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
    </Card>
  );
}
