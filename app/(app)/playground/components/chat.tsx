"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { textToQuillHTML } from "@/lib/helpers";
import ReadText from "@/components/playground/components/ReadText";
import RichEditor from "@/components/playground/components/RichEditor";
import { usePlayground } from "@/components/providers/PlaygroundProvider";
import { useContact } from "@/components/providers/ContactProvider";
import axios from "axios";

type Message = { role?: string; content: string };

interface ChatProps {
  messages?: Message[];
  setMessages?: (value: Message[]) => void;
}

export function CardsChat({messages}: ChatProps) {
  const {selectedPreset, setMessages} = usePlayground();
  const {user, system} = useContact();
  const [open, setOpen] = React.useState(false);
  const [selectedMessage, setSelectedMessage] = React.useState<Message & { index?: number } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const chatContainerRef = React.useRef(null);

  // Function to fetch conversations
  const getConversations = async () => {
    try {
      let newContact = await axios.get(`/api/contacts/${user?.phone}`)
      .then((response) => {
        return response.data
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        return user
      }) as any;
      
      console.log(newContact, 'NEW USER')
      const response = await fetch(`/api/conversations?contact=${user.phone}&system=${system.phone}&preset=${newContact?.activePreset}&status=pending`); // Update the endpoint URL if necessary
      
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      
      const data = await response.json();
      console.log(selectedPreset, 'RESP CONVO', data)
      if (data && Array.isArray(data)) {
        setMessages(data); // Assuming `data.data` contains the conversations array
      }
      
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } 
  };

  // // Fetch conversations on component mount

  React.useEffect(() => {
    // Trigger function every 10 seconds
    const intervalId = setInterval(() => {
      getConversations();
    }, 10000); // 10000ms = 10 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [selectedPreset]); // Empty dependency array ensures this runs only once on mount

  // Handle deleting a message
  const handleDelete = (ind: number) => {
    let newMessages = [...(messages || [])];
    if (ind > -1 && ind < newMessages.length) {
      newMessages.splice(ind, 1); // Removes 1 element at the specified index
    }
    setMessages(newMessages);
  };

  return (
    <>
      <div
        className="space-y-4 pt-5"
        ref={chatContainerRef}
      >
        {isLoading && <p>Loading conversations...</p>}
        {!isLoading && messages && messages.map((message: any, index: number) => (
          <div
            key={index}
            className={cn(
              "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground items-start"
                : "bg-muted items-end"
            )}
          >
            <div>
              <a onClick={() => handleDelete(index)}>Delete</a>&nbsp;&nbsp;
              <a onClick={() => {
                setOpen(true);
                setSelectedMessage({ ...message, index });
              }}>Edit</a>
            </div>
            <ReadText
              value={textToQuillHTML(message.content)}
            />
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 outline-none">
          <DialogHeader className="px-4 pb-4 pt-5">
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4 pt-5 min-h-[300px] mt-5">
            <RichEditor
              placeholder="What is this content about?"
              value={selectedMessage?.content}
              onChange={(e) =>
                setSelectedMessage({ ...selectedMessage, content: e })
              }
            />
          </div>
          <DialogFooter className="flex items-center border-t p-4 sm:justify-between">
            <Button
              onClick={() => {
                if (selectedMessage?.index !== undefined) {
                  const updatedMessages = [...(messages || [])];
                  updatedMessages[selectedMessage.index] = {
                    role: selectedMessage.role,
                    content: selectedMessage.content || "",
                  };
                  setMessages(updatedMessages);
                }
                setOpen(false);
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
