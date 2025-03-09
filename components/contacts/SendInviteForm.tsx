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

import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // ⬅ Import useRouter
import { SidebarOptInForm } from "../sidebar-opt-in-form";
import { useComponent } from "../providers/ComponentContext";

export function SendInviteForm() {
  const { modal, setModal, record } = useComponent();




  // 📌 Handle Form Submission



  return (
    <>
      <Dialog open={modal == 'sendInvite'} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <SidebarOptInForm record={record} />
        </DialogContent>
      </Dialog >
    </>
  );
}
