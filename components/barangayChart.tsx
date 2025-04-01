"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useState } from "react"

// Sample chart data
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

// Chart configuration
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
  label: {
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig

export function BarangayChart({data}) {
  // State for active chart selection (mobile/desktop)
  const [active, setActive] = useState('unknown')

  // Handler for dropdown selection change
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActive(event.target.value)
  }

  // Filter data based on selected graph type (mobile or desktop)
  const activeData = Object.entries(data).map(([key, value]) => {return { ...value, barangay: key}}).map((data) => ({
    month: data.barangay,
    value: data[active], // Dynamically select the value based on the active graph
  }))


  return (
    <Card>
      <CardHeader>
        <CardTitle>Barangay Chart</CardTitle>
        <CardDescription>List as of 2025</CardDescription>
        
        {/* Dropdown to select active graph (Mobile/Desktop) */}
        <div className="mt-2">
          <select
            value={active}
            onChange={handleSelectChange}
            className="p-2 border rounded-md bg-white"
          >
            <option value="total">ALL</option>
            <option value="confirm">Confirm</option>
            <option value="declined">Declined</option>
            <option value="undecided">Undecided</option>
          </select>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={activeData} // Use the filtered active data
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="month"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)} // Shorten the month name
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="value"
              layout="vertical"
              fill={active === 'desktop' ? "var(--color-desktop)" : "var(--color-mobile)"}
              radius={4}
            >
              <LabelList
                dataKey="month"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
