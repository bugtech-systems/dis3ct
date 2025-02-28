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
import io from "socket.io-client";
import { useContact } from "./providers/ContactProvider";
import { useComponent } from "./providers/ComponentContext";

const socket = io("http://localhost:5000");


export function ScannerForm() {
  const { user, system } = useContact();
  const { modal, setModal, modalId } = useComponent()

  // const [showContactDialog, setShowContactDialog] = React.useState(false);
  const router = useRouter(); // ⬅ Initialize useRouter

  // State for form fields
  const [phone, setPhone] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");

  const [selectedRegion, setSelectedRegion] = React.useState<any>(null);
  const [selectedProvince, setSelectedProvince] = React.useState<any>(null);
  const [selectedMunicipality, setSelectedMunicipality] = React.useState<any>(null);
  const [isBiometric, setIsBiometric] = React.useState(false);
  const [message, setMessage] = React.useState("Connecting to WebSocket...");







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





      const response = await axios.post("/api/contacts", {
        phone,
        name,
        address,
        regCode: selectedRegion?.regCode,
        regDesc: selectedRegion?.regDesc,
        provDesc: selectedProvince?.provDesc,
        citymunDesc: selectedMunicipality?.citymunDesc,
        brgyDesc: selectedBarangay?.brgyDesc,
        provCode: selectedProvince?.provCode,
        citymunCode: selectedMunicipality?.citymunCode,
        brgyCode: selectedBarangay?.brgyCode,
        system: system?.phone,
        referrer: user?.phone
      });

      // toast({ title: "Success", description: response.data.message, status: "success" });
      setPhone('')
      setName('')
      setAddress('')
      setShowContactDialog(false); // Close modal after success
      toast.success(response.data.message);
      router.refresh();

    } catch (error: any) {
      console.log(error, 'ERROR')
      toast.error(error.response?.data?.error || "Failed to save contact.");
    }
  };


  const handleEnroll = async () => {
    // e.preventDefault();

    try {
      const response = await axios.post("http://localhost:5000/enroll", {
        user_id: modalId
      });

      console.log(response, 'RESSPP')
    } catch (error: any) {
      console.log(error, 'ERROR')
      toast.error(error.response?.data?.error || "Failed to save contact.");
    }
  };

  const handleInit = () => {
    // if (modal == 'scanner') {
    socket.emit('init')
    setIsBiometric(true)
    // }

  }

  const handleShutdown = (e: any) => {
    console.log(e, 'EEE')
    if (!e) {

      socket.emit('shutdown')
      setIsBiometric(false)
      // setModal(false)
    }

  }



  React.useEffect(() => {

    socket.on("connect", () => {
      console.log("Connected to WebSocket server.");
      setIsBiometric(true);

    });

    socket.on("server_response", (data) => {
      console.log("Server response received:", data);
      setMessage(data.message);
    });

    socket.on("scanner_ready", () => {
      console.log('SCANNER READY')
      setIsBiometric(true);
      setMessage("Fingerprint scanner is ready.");
    });

    socket.on("fingerprint_scan", (data) => {
      console.log('FINGER SCANNED', data)
      if (data.status === "scanning") {
        setMessage("Scanning fingerprint...");
      } else if (data.status === "scanned") {
        setMessage("Fingerprint detected!");
      }
    });

    socket.on("fingerprint_not_verified", (data) => {
      console.log('FINGER NOT FOUND!', data)
      setMessage('FINGER NOT FOUND!')
    });

    socket.on("fingerprint_verified", (data) => {
      console.log('FINGER FOUND!', data)
      setMessage('FINGER FOUND!')
    });


    return () => {
      socket.off("connect");
      socket.off("server_response");
      socket.off("scanner_ready");
      socket.off("fingerprint_verified");
      socket.off("fingerprint_not_verified");
      socket.off("fingerprint_scan");

    };
  }, [modal]);





  // React.useEffect(() => {
  //   if (!modal && isBiometric) {
  //     setIsBiometric(false)
  //     socket.emit('shutdown')
  //   }

  // }, [modal])


  return (
    <>
      {/* <Button onClick={() => setShowContactDialog(true)}>
        <BookPlusIcon />
      </Button> */}
      <Dialog open={modal == 'scanner'} onOpenChange={(e) => setModal(e)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>Manage record information.</DialogDescription>
          </DialogHeader>
          {message}
          <Button onClick={() => handleEnroll()}>Enroll</Button>
          <br />
          <Button onClick={() => handleInit()}>Init</Button>
          <br />
          <Button onClick={() => handleShutdown(null)}>Shutdown</Button>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>Shutdown</Button>
            <Button onClick={() => handleSubmit()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
