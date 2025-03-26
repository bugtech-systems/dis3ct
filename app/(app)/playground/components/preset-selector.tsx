"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { usePlayground } from "@/components/providers/PlaygroundProvider"
import { useContact } from "@/components/providers/ContactProvider"

// Define Preset interface
interface Preset {
  id: number
  name: string
  description: string
  value: string
}

export function PresetSelector() {
  const { selectedPreset, setSelectedPreset, presets, setPresets } = usePlayground()
  const { system } = useContact()

  const [open, setOpen] = React.useState(false)
  // const [selectedPreset, setSelectedPreset] = React.useState<Preset | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchPresets = async () => {
    try {
      const response = await fetch(`/api/presets?system=${system.phone}`)
      if (!response.ok) {
        throw new Error("Failed to fetch presets")
      }
      const data = await response.json()
      console.log(data.data)
      setPresets(data.data) // Assuming API returns { success: true, data: [...] }
      setError(null)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Fetch presets from the API
  React.useEffect(() => {

    if (system) {
      fetchPresets()
    }
  }, [system])


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Load a preset..."
          aria-expanded={open}
          className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        >
          {(selectedPreset && selectedPreset.name) ? selectedPreset.name : "Load a preset..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search presets..." />
          <CommandList>
            {loading && <CommandEmpty>Loading presets...</CommandEmpty>}
            {error && <CommandEmpty>{error}</CommandEmpty>}
            {!loading && !error && presets.length === 0 && (
              <CommandEmpty>No presets found.</CommandEmpty>
            )}
            {(selectedPreset && selectedPreset.name) && (
              <CommandGroup className="pt-2">
                <CommandItem
                  onSelect={() => {
                    setSelectedPreset({
                      topP: 0.9,
                      maxTokens: 2000,
                      temperature: 0.3
                    })
                    setOpen(false)
                  }}
                >
                  Clear Selection
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Presets">
              {presets.map((preset: any, index: number) => (
                <CommandItem
                  key={index}
                  onSelect={() => {
                    setSelectedPreset({
                      ...preset,
                      systemBehavior: preset.systemBehavior,
                      temperature: preset.aiTemperature,
                      maxTokens: preset.aiMaxLength,
                      topP: preset.aiTopP,
                      aiModel: preset.modelName,
                      instruction: preset.instruction
                    })
                    setOpen(false)
                  }}
                >
                  {preset.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedPreset?.value === preset.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
