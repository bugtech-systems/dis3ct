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

const statuses = ["pending", "default", "closed"]

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

      const response = await fetch(`/api/interactions?contact=${selectedContact ? selectedContact.phone : user.phone}&system=${system.phone}&preset=${selectedPreset?._id}`); // Update the endpoint URL if necessary

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      console.log(data, 'MESSAGESSS')
      if (data && Array.isArray(data)) {
        setMessages(data); // Assuming `data.data` contains the conversations array
      }

    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };
  // Handle deleting a message
  const handleDelete = async (ind: number) => {
    let newMessages = [...(messages || [])];
    let message = newMessages[ind];


    const response = await axios.delete(`/api/interactions/${message._id}`);

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

    const response = await axios.patch(`/api/interactions/${selectedMessage._id}`, {
      inputText: convertQuillToPlainText(selectedMessage?.inputText || ""),
      responseText: convertQuillToPlainText(selectedMessage?.responseText || ""),
      feedback: { correction: convertQuillToPlainText(selectedMessage?.feedback?.correction || "") },
      preset: selectedMessage?.preset,
      status: selectedMessage?.status
    }).catch(err => {
      console.log(err)
    });

    if (response?.status == 200) {
      // newMessages[selectedMessage.index] = selectedMessage
      // setMessages(newMessages);
      setOpen(false);
      setSelectedMessage(null)
      getConversations()
    }
  }



  console.log(messages, selectedMessage, 'MESSAGES')
  return (
    <>
      <div
        className="space-y-4 pt-5"
        ref={chatContainerRef}
      >
        {isLoading && <p>Loading conversations...</p>}
        {messages?.map((message: any, index: number) => (
          <>
            <div
              key={message._id}
              className={"flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ml-auto bg-primary text-primary-foreground items-start"}
            >
              <div>
                <i onClick={() => handleDelete(index)}>Delete</i>&nbsp;&nbsp;
                <i onClick={() => {
                  setOpen(true);
                  setSelectedMessage({ ...message, index });
                }}>Edit</i>
              </div>
              <ReadText
                value={message.inputText}
              />
            </div>
            <div
              key={index}
              className={"flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted items-end"}
            >
              <div>
                <i onClick={() => handleDelete(index)}>Delete</i>&nbsp;&nbsp;
                <i onClick={() => {
                  setOpen(true);
                  setSelectedMessage({ ...message, index });
                }}>Edit</i>
              </div>
              <ReadText
                value={message?.feedback?.correction ? message?.feedback?.correction : message.responseText}
              />
            </div>

          </>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col gap-1 p-1 py-5 outline-none">
          <DialogHeader className="px-4">
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <div className="mt-5 min-h-[300px] max-h-[500px]">
            <div className="space-y-2">
              <Label htmlFor="preset">Prompt</Label>
              <Textarea
                className="p-4"
                placeholder="Write message (max 150 characters)..."
                value={selectedMessage?.inputText}
                onChange={(e) =>
                  setSelectedMessage({ ...selectedMessage, inputText: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset">Response</Label>
              <Textarea
                className="p-4"
                placeholder="Write message (max 150 characters)..."
                value={selectedMessage?.responseText}
                onChange={(e) =>
                  setSelectedMessage({ ...selectedMessage, responseText: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset">Correction</Label>
              <Textarea
                className="p-4"
                placeholder="Write message (max 150 characters)..."
                value={selectedMessage?.feedback?.correction}
                onChange={(e) =>
                  setSelectedMessage({ ...selectedMessage, feedback: { ...selectedMessage.feedback, correction: e.target.value } })
                }
              />
            </div>
            {/*   <RichEditor
              placeholder="What is this content about?"
              value={selectedMessage?.inputText}
              onChange={(e) =>
                setSelectedMessage({ ...selectedMessage, inputText: e })
              }
            />

            <RichEditor
              placeholder="What is this content about?"
              value={selectedMessage?.responseText}
              onChange={(e) =>
                setSelectedMessage({ ...selectedMessage, responseText: e })
              }
            />
            <RichEditor
              placeholder="What is this correction about?"
              value={selectedMessage?.feedback?.correction}
              onChange={(e) =>
                setSelectedMessage({ ...selectedMessage, feedback: { ...selectedMessage.feedback, correction: e } })
              }
            /> */}

            <div className="flex flex-row justify-around">
              <div className="space-y-2 pr-2 flex-grow">
                <Label htmlFor="preset">Preset</Label>
                <Select onValueChange={(e) =>
                  setSelectedMessage({ ...selectedMessage, preset: e })
                } defaultValue={selectedMessage?.preset} value={selectedMessage?.preset}>

                  <SelectTrigger>
                    <SelectValue placeholder="Select a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset: any, index: any) => {
                      console.log(preset._id, 'PRES')
                      return (
                        <SelectItem value={String(preset?._id)} key={index}>
                          <span className="font-medium">{preset.name}</span>
                        </SelectItem>
                      )
                    })
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 pl-2 flex-grow">
                <Label htmlFor="preset">Status</Label>
                <Select onValueChange={(e) =>
                  setSelectedMessage({ ...selectedMessage, status: e })
                } defaultValue={selectedMessage?.status} value={selectedMessage?.status}>

                  <SelectTrigger>
                    <SelectValue placeholder="Select a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((preset: any, index: any) => {
                      return (
                        <SelectItem value={preset} key={index}>
                          <span className="font-medium">{String(preset).toUpperCase()}</span>
                        </SelectItem>
                      )
                    })
                    }
                  </SelectContent>
                </Select>
              </div>
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
