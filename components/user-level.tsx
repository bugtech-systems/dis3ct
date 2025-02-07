import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const userLevelOptions: Record<string, { value: string; label: string }[]> = {
  admin: [
    { value: "regional", label: "Region" },
    { value: "provincial", label: "Province" },
    { value: "municipal", label: "City/Municipality" },
    { value: "barangay", label: "Barangay" },
  ],
  system: [
    { value: "regional", label: "Region" },
    { value: "provincial", label: "Province" },
    { value: "municipal", label: "City/Municipality" },
    { value: "barangay", label: "Barangay" },
  ],
  regional: [
    { value: "provincial", label: "Province" },
    { value: "municipal", label: "City/Municipality" },
    { value: "barangay", label: "Barangay" },
  ],

  provincial: [
    { value: "municipal", label: "City/Municipality" },
    { value: "barangay", label: "Barangay" },
  ],
  municipal: [{ value: "barangay", label: "Barangay" }],
  barangay: [],
};

export function UserLevelSelect({ userLevel, selectedLevel, setSelectedLevel }: { userLevel: string, selectedLevel: string, setSelectedLevel: (event: string) => void }) {
  //   const [selectedLevel, setSelectedLevel] = useState("");

  // Get options dynamically based on userLevel
  const options = userLevelOptions[userLevel] || [];

  // Hide select field if userLevel is Barangay
  if (options.length === 0) return null;

  return (
    <>
      <Label htmlFor="userLevel">Access Level</Label>
      <Select onValueChange={setSelectedLevel} value={selectedLevel}>
        <SelectTrigger>
          <SelectValue placeholder="Select a level" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="font-medium">{option.label}</span> -{" "}
              <span className="text-muted-foreground">{option.label} Level</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>

  );
}
