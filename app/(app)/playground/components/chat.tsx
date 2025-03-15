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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { convertQuillToPlainText, convertRichTextToPlain, textToQuillHTML } from "@/lib/helpers";
import ReadText from "@/components/playground/components/ReadText";
import RichEditor from "@/components/playground/components/RichEditor";
import { usePlayground } from "@/components/providers/PlaygroundProvider";
import { useContact } from "@/components/providers/ContactProvider";
import axios from "axios";
import { Textarea } from "@/components/ui/textarea";
import { IConversation } from "@/models/Conversation";
import { Label } from "@/components/ui/label";
import { IAiPreset } from "@/models/AiPreset";

type Message = { role?: string; content?: string };

interface ChatProps {
  messages?: IConversation[];
  setMessages?: (value: Message[]) => void;
}

export function CardsChat({ messages }: ChatProps) {
  const { presets, selectedPreset, selectedContact, setMessages } = usePlayground();
  const { user, system } = useContact();
  const [open, setOpen] = React.useState(false);
  const [selectedMessage, setSelectedMessage] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const chatContainerRef = React.useRef(null);

  // Function to fetch conversations
  const getConversations = async () => {
    try {
      // setLoading(true)

      // .finally(() => setLoading(false));

      const response = await fetch(`/api/conversations?contact=${selectedContact ? selectedContact.phone : user.phone}&system=${system.phone}&preset=${selectedPreset?.value}`); // Update the endpoint URL if necessary

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      /*     if (data && Array.isArray(data)) {
            setMessages(data); // Assuming `data.data` contains the conversations array
          } */

    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // // Fetch conversations on component mount

  // React.useEffect(() => {
  //   // Trigger function every 10 seconds

  //   const intervalId = setInterval(() => {
  //     if(user){
  //     getConversations();
  // }
  //   }, 10000); // 10000ms = 10 seconds

  //   // Cleanup interval on component unmount
  //   return () => clearInterval(intervalId);
  // }, [selectedPreset, user]); // Empty dependency array ensures this runs only once on mount

  // Handle deleting a message
  const handleDelete = async (ind: number) => {
    let newMessages = [...(messages || [])];
    let message = newMessages[ind];


    const response = await axios.delete(`/api/conversations/${message._id}`);

    if (response.status == 200) {
      if (ind > -1 && ind < newMessages.length) {
        newMessages.splice(ind, 1); // Removes 1 element at the specified index
      }
      setMessages(newMessages);
      getConversations();

    }
  };

  const handleSave = async () => {
    let newMessages = [...(messages || [])] as any;

    if (!selectedMessage?._id) return;

    const response = await axios.patch(`/api/conversations/${selectedMessage._id}`, {
      content: convertQuillToPlainText(selectedMessage?.content),
      preset: selectedMessage?.preset
    }).catch(err => {
      console.log(err)
    });

    if (response?.status == 200) {
      newMessages[selectedMessage.index] = selectedMessage
      setMessages(newMessages);
      setOpen(false);
      setSelectedMessage(null)
      getConversations()
    }
  }



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
                setSelectedMessage({ ...message, preset: message?.preset?._id, index });
              }}>Edit</a>
            </div>
            <ReadText
              value={textToQuillHTML(message.content)}
            />
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col gap-1 p-1 py-5 outline-none">
          <DialogHeader className="px-4">
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <div className="mt-5 min-h-[300px] max-h-[500px]">
            {/*  <Textarea
              className="p-4"
              placeholder="Write message (max 150 characters)..."
              value={selectedMessage?.content}
              onChange={(e) =>
                setSelectedMessage({ ...selectedMessage, content: e.target.value })
              }
            /> */}
            <RichEditor
              placeholder="What is this content about?"
              value={selectedMessage?.content}
              onChange={(e) =>
                setSelectedMessage({ ...selectedMessage, content: e })
              }
            />

            <div className="space-y-2">
              <Label htmlFor="preset">Preset</Label>
              <Select onValueChange={(e) =>
                setSelectedMessage({ ...selectedMessage, preset: e })
              } defaultValue={selectedMessage?.preset} value={selectedMessage?.preset}>

                <SelectTrigger>
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset: any) => {
                    console.log(preset._id, 'PRES')
                    return (
                      <SelectItem value={preset?._id} key={preset?._id}>
                        <span className="font-medium">{preset.name}</span>
                      </SelectItem>
                    )
                  })
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex items-center border-t p-4 sm:justify-between">
            <Button
              onClick={() => {
                if (selectedMessage?.index !== undefined) {
                  /*     const updatedMessages = [...(messages || [])];
                      updatedMessages[selectedMessage.index] = {
                        role: selectedMessage.role,
                        content: selectedMessage.content || "",
                      }; */

                  // setMessages(updatedMessages);
                  handleSave()
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>

      </Dialog>
    </>
  );
}
