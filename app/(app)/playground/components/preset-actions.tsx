"use client"

import * as React from "react"
import { Dialog } from "@radix-ui/react-dialog"
import { MoreHorizontal } from "lucide-react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import toast from "react-hot-toast"
import axios from "axios"
import { usePlayground } from "@/components/providers/PlaygroundProvider"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useContact } from "@/components/providers/ContactProvider"
import { sanitizePhoneNumber } from "@/lib/helpers"

export function PresetActions() {
  const [open, setIsOpen] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [resources, setResources] = React.useState([]);
  const [activeResource, setActiveResource] = React.useState<any>()
  const [resourceData, setResourceData] = React.useState({});
  const { parentSystem } = useContact();
  const router = useRouter();

  const handleDeleteResource = async () => {
    if (activeResource && activeResource?._id) {
      let resp = await axios.delete(`/api/system/${sanitizePhoneNumber(parentSystem.phone)}/resources?id=${resourceData?._id}`);
      setResourceData({})
      setActiveResource()
      router.refresh();
    }
  }

  const handleSaveResource = async () => {
    // e.preventDefault()

    try {
      if (!resourceData?._id) {
        let resp = await axios.post(`/api/system/${sanitizePhoneNumber(parentSystem.phone)}/resources`, { ...resourceData, type: 'intent' });
        if (resp.status >= 200) {
          toast.success("This resource has been saved.");
          setShowDeleteDialog(false)
          setIsOpen(false)
          setResourceData({ title: "", value: "", note: "" })
        }
      } else {
        let resp = await axios.put(`/api/system/${sanitizePhoneNumber(parentSystem.phone)}/resources`, { ...resourceData, type: 'intent', id: resourceData?._id });
        if (resp.status >= 200) {
          toast.success("This resource has been saved.");
          setShowDeleteDialog(false)
          setIsOpen(false)
          setResourceData({ title: "", value: "", note: "" })
        }
      }
      router.refresh();
    } catch (err) {
      console.log("Failed to update the course", err);
      toast.error("Something went wrong!");
    }
  };

  const handleGetResources = async () => {
    let response = await axios.get(`/api/system/${sanitizePhoneNumber(parentSystem?.phone)}/resources`).catch((err) => { return null })

    if (response?.status == 200) {
      setResources(response.data)
    } else {
      setResources([])
    }
  }


  React.useEffect(() => {
    if (parentSystem) {
      handleGetResources()
    }

  }, [parentSystem])

  React.useEffect(() => {

    return () => {
      setResourceData({})
      setActiveResource()
    }

  }, [open])


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon">
            <span className="sr-only">Actions</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsOpen(true)}>
            Content filter preferences
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            Add Intent Resource
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Intent filter preferences</DialogTitle>
            <DialogDescription>
              The content filter flags text that may violate our content policy.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <div className="space-y-2 pr-2 flex-grow">
              <Label htmlFor="preset">Preset</Label>
              <Select onValueChange={(e) => {
                setActiveResource(e)
                setResourceData(e)
              }
              } value={activeResource}>

                <SelectTrigger>
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  {(activeResource && activeResource?._id) && (
                    <SelectItem value={{ title: "", value: "", note: "" }} >
                      <span className="font-medium">Clear Selected</span>
                    </SelectItem>)
                  }
                  {resources.map((preset: any, index: any) => {
                    return (
                      <SelectItem value={preset} key={index}>
                        <span className="font-medium">{preset.title}</span>
                      </SelectItem>
                    )
                  })
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="mt-5 min-h-[300px] max-h-[500px]">
              <div className="space-y-2">
                <Label htmlFor="preset">Name</Label>
                <Input
                  className="p-4"
                  placeholder="Write intent name"
                  value={resourceData?.title}
                  onChange={(e) =>
                    setResourceData({ ...resourceData, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preset">Actions</Label>
                <Textarea
                  className="p-4"
                  placeholder="Write intents value (max 150 characters)..."
                  value={resourceData?.value}
                  onChange={(e) =>
                    setResourceData({ ...resourceData, value: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preset">Instruction</Label>
                <Textarea
                  className="p-4"
                  rows={5}
                  placeholder="Write message (max 150 characters)..."
                  value={resourceData?.note}
                  onChange={(e) =>
                    setResourceData({ ...resourceData, note: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter className="w-full d-flex flex-row justify-between">
            {(activeResource && activeResource?._id) &&
              <Button
                variant="destructive"
                onClick={() => handleDeleteResource()}
              >
                Delete
              </Button>
            }
            <>
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              {(activeResource && activeResource?._id) &&
                <Button
                  variant="outline"
                  onClick={() => handleSaveResource()}
                >
                  Save
                </Button>
              }
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog >
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Write Intent</AlertDialogTitle>

          <div className="mt-5 min-h-[300px] max-h-[500px]">
            <div className="space-y-2">
              <Label htmlFor="preset">Name</Label>
              <Input
                className="p-4"
                placeholder="Write intent name"
                value={resourceData?.title}
                onChange={(e) =>
                  setResourceData({ ...resourceData, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset">Actions</Label>
              <Textarea
                className="p-4"
                placeholder="Write intents value (max 150 characters)..."
                value={resourceData?.value}
                onChange={(e) =>
                  setResourceData({ ...resourceData, value: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset">Instruction</Label>
              <Textarea
                className="p-4"
                rows={5}
                placeholder="Write message (max 150 characters)..."
                value={resourceData?.note}
                onChange={(e) =>
                  setResourceData({ ...resourceData, note: e.target.value })
                }
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => handleSaveResource()}
            >
              Save
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
