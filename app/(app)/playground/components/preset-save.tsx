import { usePlayground } from "@/components/providers/PlaygroundProvider";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";

export function PresetSave() {
  const {setPresets,   selectedPreset, preset, setPreset} = usePlayground();
  const [open, setOpen] = useState(false)


  const fetchPresets = async () => {
    try {
      const response = await fetch("/api/presets")
      if (!response.ok) {
        throw new Error("Failed to fetch presets")
      }
      const data = await response.json()
      setPresets(data.data) // Assuming API returns { success: true, data: [...] }
    } catch (err: any) {
    console.log(err, 'FETCH ERROR')
      // setError(err.message || "An unexpected error occurred")
    }
  }
  

const handleChanges = (prop: any) => (event: any) => {
    setPreset({...preset, [prop]: event.target.value})
}

const handleSavePreset = async () => {
  // e.preventDefault()

  try {
      if(selectedPreset && selectedPreset.id){
        let resp = await axios.patch(`/api/presets/${selectedPreset.id}`, preset);

        console.log(resp.data, 'UPDATED PRESET')

        if(resp.data){
          toast.success("Preset Updated");
        }        

      } else {
        let resp = await axios.post(`/api/presets`, {
        ...preset,
 /*          systemBehavior,
          modelName: selectedModel.id,
          aiTemperature: temperature,
          aiTopP: topP,
          aiMaxLength: maxTokens */
        });
        console.log(resp.data, 'NEW PRESET')
        if(resp.data){
          toast.success("Preset Created");
        }   
      }
  
  
      fetchPresets()
    setOpen(false)
    // router.refresh();
  } catch (err) {
    console.log("Failed to update the course", err);
    toast.error("Something went wrong!");
  }
};


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Save</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Save preset</DialogTitle>
          <DialogDescription>
            This will save the current playground state as a preset which you
            can access later or share with others.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoFocus 
              value={preset.name}
              onChange={handleChanges('name')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" 
                 value={preset.description}
                 onChange={handleChanges('description')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={() => handleSavePreset()}>Save</Button>
        </DialogFooter>
        
      </DialogContent>
    </Dialog>
  )
}
