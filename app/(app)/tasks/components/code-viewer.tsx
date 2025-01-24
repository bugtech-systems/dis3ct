import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Task } from "../data/schema"
import { Textarea } from "@/components/ui/textarea"

export function CodeViewer({open, setOpen, row} : { open: boolean, setOpen: any, row: Task }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
  
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{row.taskId}</DialogTitle>
          <DialogDescription>
            {row.title}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
         <Textarea
                  className="p-4"
                  placeholder="Write message (max 150 characters)..."
                  value={row.taskObject || ""}
                  // onChange={handleMessageChange}
                />
        </div>
      </DialogContent>
    </Dialog>
  )
}
