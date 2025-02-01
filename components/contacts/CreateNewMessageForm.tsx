"use client";

import * as React from "react";
import { MessageSquarePlusIcon } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useContact } from "../providers/ContactProvider";

export function CreateNewMessageForm({ selectedContacts = [] }: { selectedContacts: any }) {
  const [showContactDialog, setShowContactDialog] = React.useState(false);
  const { system } = useContact()
  const [message, setMessage] = React.useState("");
  const [isFlash, setIsFlash] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  // 📌 Max characters allowed
  const MAX_CHARACTERS = 500;
  const recipientCount = selectedContacts.length;

  // 📌 Handle message change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARACTERS) {
      setMessage(e.target.value);
    }
  };

  // 📌 Handle form submission (Send SMS Task)
  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Message is required!");
      return;
    }

    if (selectedContacts.length === 0) {
      toast.error("No recipients selected!");
      return;
    }

    setLoading(true);

    try {
      // Prepare request payload
      const payload = {
        recipients: selectedContacts.map((contact: any) => contact.phone), // Extract phone numbers
        message,
        isFlash,
        system: system.phone
      };

      const response = await axios.post("/api/tasks/sms", payload);

      // Reset form state after successful submission
      setMessage("");
      setIsFlash(false);
      setShowContactDialog(false);
      toast.success(response.data.message);
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowContactDialog(true)}>
        <MessageSquarePlusIcon />
      </Button>
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Write and send a new message.</DialogDescription>
          </DialogHeader>

          <Separator className="mt-auto" />

          <div>
            <p>Total Recipients: <strong>{recipientCount}</strong></p>
          </div>

          <div className="p-4">
            <form>
              <div className="grid gap-4">
                {/* 📌 Textarea with character limit */}
                <Textarea
                  className="p-4"
                  placeholder="Write message (max 150 characters)..."
                  value={message}
                  onChange={handleMessageChange}
                />
                <p className={`text-sm ${message.length === MAX_CHARACTERS ? "text-red-500" : "text-muted-foreground"}`}>
                  {message.length}/{MAX_CHARACTERS}
                </p>

                <div className="flex items-center">
                  <Label htmlFor="flash-message" className="flex items-center gap-2 text-xs font-normal">
                    <Switch id="flash-message" checked={isFlash} onCheckedChange={setIsFlash} /> Flash Message
                  </Label>
                </div>
              </div>
            </form>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || message.length > MAX_CHARACTERS}>
              {loading ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
